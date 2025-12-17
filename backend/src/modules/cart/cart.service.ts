import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get or create cart for user
async function getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            store: { select: { id: true, name: true } },
                            inventory: { select: { quantity: true } },
                            images: { where: { isPrimary: true }, take: 1 },
                        },
                    },
                },
            },
        },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                store: { select: { id: true, name: true } },
                                inventory: { select: { quantity: true } },
                                images: { where: { isPrimary: true }, take: 1 },
                            },
                        },
                    },
                },
            },
        });
    }

    return cart;
}

export async function getCart(userId: string) {
    const cart = await getOrCreateCart(userId);

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
        return sum + (parseFloat(item.product.basePrice.toString()) * item.quantity);
    }, 0);

    return {
        ...cart,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
    };
}

export async function addToCart(userId: string, productId: string, quantity: number = 1) {
    const cart = await getOrCreateCart(userId);

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true },
    });

    if (!product || !product.isActive) {
        throw new Error('Product not found or unavailable');
    }

    // Check stock
    if (product.inventory && product.inventory.quantity < quantity) {
        throw new Error(`Only ${product.inventory.quantity} items in stock`);
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_productId: { cartId: cart.id, productId },
        },
    });

    if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (product.inventory && product.inventory.quantity < newQuantity) {
            throw new Error(`Only ${product.inventory.quantity} items in stock`);
        }

        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
        });
    } else {
        // Add new item
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
            },
        });
    }

    return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        include: { product: { include: { inventory: true } } },
    });

    if (!item) {
        throw new Error('Cart item not found');
    }

    // Check stock
    if (item.product.inventory && item.product.inventory.quantity < quantity) {
        throw new Error(`Only ${item.product.inventory.quantity} items in stock`);
    }

    if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
    }

    return getCart(userId);
}

export async function removeFromCart(userId: string, itemId: string) {
    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
        throw new Error('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return getCart(userId);
}

export async function clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared' };
}
