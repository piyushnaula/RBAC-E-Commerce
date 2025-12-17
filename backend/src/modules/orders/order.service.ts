import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

interface CreateOrderInput {
    addressId: string;
    notes?: string;
}

export async function createOrder(userId: string, input: CreateOrderInput) {
    const { addressId, notes } = input;

    // Get cart with items
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            store: { include: { vendor: true } },
                            inventory: true,
                        },
                    },
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
    });

    if (!address) {
        throw new Error('Address not found');
    }

    // Calculate totals and prepare order items
    let subtotal = 0;
    const orderItems: {
        productId: string;
        vendorId: string;
        title: string;
        sku: string;
        price: any;
        quantity: number;
    }[] = [];

    for (const item of cart.items) {
        const product = item.product;

        // Check stock
        if (product.inventory && product.inventory.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.title}`);
        }

        const itemPrice = parseFloat(product.basePrice.toString());
        subtotal += itemPrice * item.quantity;

        orderItems.push({
            productId: product.id,
            vendorId: product.store.vendor.id,
            title: product.title,
            sku: product.sku,
            price: product.basePrice,
            quantity: item.quantity,
        });
    }

    const tax = subtotal * 0.18; // 18% GST
    const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
    const total = subtotal + tax + shippingCost;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
            data: {
                userId,
                addressId,
                orderNumber: generateOrderNumber(),
                subtotal,
                tax,
                shippingCost,
                total,
                notes,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: true,
                address: true,
            },
        });

        // Update inventory
        for (const item of cart.items) {
            if (item.product.inventory) {
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });
            }
        }



        return newOrder;
    });

    return order;
}

export async function getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            items: {
                include: {
                    product: {
                        select: { id: true, slug: true },
                    },
                },
            },
            address: true,
        },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
}

export async function getUserOrders(userId: string) {
    return prisma.order.findMany({
        where: { userId },
        include: {
            items: { select: { id: true, title: true, quantity: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Address management
export async function addAddress(userId: string, data: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    isDefault?: boolean;
}) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
        await prisma.address.updateMany({
            where: { userId },
            data: { isDefault: false },
        });
    }

    return prisma.address.create({
        data: {
            userId,
            ...data,
        },
    });
}

export async function getUserAddresses(userId: string) {
    return prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
    });
}
