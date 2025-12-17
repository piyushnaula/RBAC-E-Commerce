import { PrismaClient, RefundStatus } from '@prisma/client';
import * as auditService from '../audit/audit.service';

const prisma = new PrismaClient();

interface RequestRefundInput {
    orderId: string;
    reason: string;
}

// Customer requests refund
export async function requestRefund(userId: string, input: RequestRefundInput) {
    const { orderId, reason } = input;

    // Get order with payment
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { payment: true, refund: true },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (!order.payment || order.payment.status !== 'CAPTURED') {
        throw new Error('Order has no completed payment');
    }

    if (order.refund) {
        throw new Error('Refund already requested for this order');
    }

    // Only allow refund for delivered or within 7 days
    const orderDate = new Date(order.createdAt);
    const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceOrder > 7 && order.status !== 'DELIVERED') {
        throw new Error('Refund request period has expired');
    }

    const refund = await prisma.refund.create({
        data: {
            paymentId: order.payment.id,
            orderId: order.id,
            userId,
            amount: order.total,
            reason,
            status: 'REQUESTED',
        },
    });

    await auditService.createAuditLog({
        userId,
        action: 'REFUND_REQUESTED',
        entity: 'Refund',
        entityId: refund.id,
        newValue: { orderId, reason, amount: order.total },
    });

    return refund;
}

// Get user's refund requests
export async function getUserRefunds(userId: string) {
    return prisma.refund.findMany({
        where: { userId },
        include: {
            order: { select: { id: true, orderNumber: true, total: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Admin: Get all refund requests
export async function getAllRefunds(status?: RefundStatus) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.refund.findMany({
        where,
        include: {
            user: { select: { id: true, email: true } },
            order: { select: { id: true, orderNumber: true, total: true } },
            payment: { select: { razorpayPaymentId: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Admin: Process refund
export async function processRefund(
    adminUserId: string,
    refundId: string,
    action: 'APPROVE' | 'REJECT',
    adminNotes?: string
) {
    const refund = await prisma.refund.findUnique({
        where: { id: refundId },
        include: { order: true, payment: true },
    });

    if (!refund) {
        throw new Error('Refund not found');
    }

    if (refund.status !== 'REQUESTED') {
        throw new Error('Refund already processed');
    }

    const oldStatus = refund.status;
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updatedRefund = await prisma.$transaction(async (tx) => {
        // Update refund
        const updated = await tx.refund.update({
            where: { id: refundId },
            data: {
                status: newStatus,
                adminNotes,
                processedBy: adminUserId,
                processedAt: new Date(),
            },
        });

        // If approved, update order status
        if (action === 'APPROVE') {
            await tx.order.update({
                where: { id: refund.orderId },
                data: { status: 'REFUNDED' },
            });

            await tx.payment.update({
                where: { id: refund.paymentId },
                data: { status: 'REFUNDED' },
            });
        }

        return updated;
    });

    await auditService.createAuditLog({
        userId: adminUserId,
        action: action === 'APPROVE' ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
        entity: 'Refund',
        entityId: refundId,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus, adminNotes },
    });

    return updatedRefund;
}

// Get refund details
export async function getRefundById(refundId: string) {
    return prisma.refund.findUnique({
        where: { id: refundId },
        include: {
            user: { select: { id: true, email: true } },
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    status: true,
                    items: { select: { title: true, quantity: true, price: true } },
                },
            },
            payment: { select: { razorpayPaymentId: true, amount: true } },
        },
    });
}
