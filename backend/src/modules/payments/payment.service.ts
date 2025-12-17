import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

interface CreatePaymentOrderInput {
    orderId: string;
}

export async function createPaymentOrder(userId: string, input: CreatePaymentOrderInput) {
    const { orderId } = input;

    // Get order
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { payment: true },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if payment already exists
    if (order.payment && order.payment.status === 'CAPTURED') {
        throw new Error('Order already paid');
    }

    // If pending payment exists, return existing Razorpay order
    if (order.payment && order.payment.status === 'PENDING') {
        return {
            razorpayOrderId: order.payment.razorpayOrderId,
            amount: parseFloat(order.total.toString()) * 100, // Razorpay uses paise
            currency: 'INR',
            orderId: order.id,
            orderNumber: order.orderNumber,
        };
    }

    // Create Razorpay order
    const amountInPaise = Math.round(parseFloat(order.total.toString()) * 100);

    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
            orderId: order.id,
            userId: userId,
        },
    });

    // Save payment record
    await prisma.payment.create({
        data: {
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            amount: order.total,
            currency: 'INR',
            status: 'PENDING',
        },
    });

    return {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        orderId: order.id,
        orderNumber: order.orderNumber,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
}

interface VerifyPaymentInput {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { payment: true },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (!order.payment || order.payment.razorpayOrderId !== razorpayOrderId) {
        throw new Error('Payment record not found');
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        // Update payment as failed
        await prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: 'FAILED' },
        });
        throw new Error('Invalid payment signature');
    }

    // Update payment and order status
    await prisma.$transaction([
        prisma.payment.update({
            where: { id: order.payment.id },
            data: {
                razorpayPaymentId,
                razorpaySignature,
                status: 'CAPTURED',
            },
        }),
        prisma.order.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
        }),
        // Clear cart after successful payment
        prisma.cartItem.deleteMany({
            where: {
                cart: {
                    userId: userId,
                },
            },
        }),
    ]);

    return {
        success: true,
        message: 'Payment verified successfully',
        orderId: order.id,
        orderNumber: order.orderNumber,
    };
}

export async function getPaymentStatus(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { payment: true },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        paymentStatus: order.payment?.status || 'NO_PAYMENT',
        total: order.total,
    };
}
