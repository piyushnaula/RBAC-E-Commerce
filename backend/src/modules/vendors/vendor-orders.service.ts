import { PrismaClient, OrderStatus } from '@prisma/client';
import * as auditService from '../audit/audit.service';

const prisma = new PrismaClient();

// Get orders for vendor's products
export async function getVendorOrders(userId: string, status?: OrderStatus) {
    // Get vendor
    const vendor = await prisma.vendor.findUnique({
        where: { userId },
    });

    if (!vendor) {
        throw new Error('Vendor account not found');
    }

    // Get order items where vendorId matches
    const where: any = { vendorId: vendor.id };
    if (status) {
        where.order = { status };
    }

    const orderItems = await prisma.orderItem.findMany({
        where,
        include: {
            order: {
                include: {
                    user: { select: { id: true, email: true } },
                    address: true,
                    payment: { select: { status: true } },
                },
            },
            product: { select: { id: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Group by order
    const ordersMap = new Map();
    for (const item of orderItems) {
        const orderId = item.orderId;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                ...item.order,
                vendorItems: [],
                vendorTotal: 0,
            });
        }
        const order = ordersMap.get(orderId);
        order.vendorItems.push({
            id: item.id,
            title: item.title,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            productId: item.productId,
        });
        order.vendorTotal += parseFloat(item.price.toString()) * item.quantity;
    }

    return Array.from(ordersMap.values());
}

// Update order status (only for vendor's items)
export async function updateOrderStatus(userId: string, orderId: string, newStatus: OrderStatus) {
    // Verify vendor has items in this order
    const vendor = await prisma.vendor.findUnique({
        where: { userId },
    });

    if (!vendor) {
        throw new Error('Vendor account not found');
    }

    const vendorItemInOrder = await prisma.orderItem.findFirst({
        where: { orderId, vendorId: vendor.id },
    });

    if (!vendorItemInOrder) {
        throw new Error('Order not found or access denied');
    }

    // Valid status transitions
    const validTransitions: { [key: string]: OrderStatus[] } = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
        REFUNDED: [],
    };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
        throw new Error('Order not found');
    }

    const currentStatus = order.status;
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
            items: { where: { vendorId: vendor.id } },
            address: true,
        },
    });

    // Audit log for order status change
    await auditService.createAuditLog({
        userId,
        action: 'ORDER_STATUS_UPDATED',
        entity: 'Order',
        entityId: orderId,
        oldValue: { status: currentStatus },
        newValue: { status: newStatus },
    });

    return updatedOrder;
}

// Get order details for vendor
export async function getVendorOrderDetails(userId: string, orderId: string) {
    const vendor = await prisma.vendor.findUnique({
        where: { userId },
    });

    if (!vendor) {
        throw new Error('Vendor account not found');
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                where: { vendorId: vendor.id },
                include: { product: { select: { id: true, slug: true } } },
            },
            user: { select: { id: true, email: true } },
            address: true,
            payment: { select: { status: true, razorpayPaymentId: true } },
        },
    });

    if (!order || order.items.length === 0) {
        throw new Error('Order not found or access denied');
    }

    // Calculate vendor's total for this order
    const vendorTotal = order.items.reduce(
        (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
        0
    );

    return {
        ...order,
        vendorTotal: vendorTotal.toFixed(2),
    };
}
