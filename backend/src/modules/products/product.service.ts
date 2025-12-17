import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateProductInput {
    storeId: string;
    title: string;
    description?: string;
    basePrice: number;
    sku: string;
    categoryId?: string;
    quantity?: number;
    images?: string[];
}

interface UpdateProductInput {
    title?: string;
    description?: string;
    basePrice?: number;
    isActive?: boolean;
    categoryId?: string;
    images?: string[];
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);
}

// Verify product belongs to user's store
async function verifyProductOwnership(productId: string, userId: string) {
    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            store: {
                vendor: { userId },
            },
        },
    });

    if (!product) {
        throw new Error('Product not found or access denied');
    }

    return product;
}

// Get user's store
async function getUserStore(userId: string) {
    const vendor = await prisma.vendor.findUnique({
        where: { userId },
        include: { store: true },
    });

    if (!vendor || !vendor.store) {
        throw new Error('You need to create a vendor account first');
    }

    return vendor.store;
}

export async function createProduct(userId: string, input: CreateProductInput) {
    const store = await getUserStore(userId);

    // Verify storeId matches user's store
    if (input.storeId !== store.id) {
        throw new Error('You can only create products for your own store');
    }

    const product = await prisma.product.create({
        data: {
            storeId: store.id,
            title: input.title,
            slug: generateSlug(input.title),
            description: input.description,
            basePrice: input.basePrice,
            sku: input.sku,
            categoryId: input.categoryId,
            inventory: {
                create: {
                    quantity: input.quantity || 0,
                },
            },
            images: {
                create: input.images?.map((url, index) => ({
                    url,
                    isPrimary: index === 0,
                    sortOrder: index,
                })) || [],
            },
        },
        include: {
            store: { select: { id: true, name: true } },
            category: true,
            inventory: true,
            images: true,
        },
    });

    return product;
}

export async function getProductById(productId: string) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            store: { select: { id: true, name: true, slug: true } },
            category: true,
            inventory: true,
            images: { orderBy: { sortOrder: 'asc' } },
            variants: true,
        },
    });

    if (!product) {
        throw new Error('Product not found');
    }

    return product;
}

export async function getAllProducts(filters?: { categoryId?: string; storeId?: string; search?: string }) {
    const where: any = { isActive: true };

    if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
    }
    if (filters?.storeId) {
        where.storeId = filters.storeId;
    }
    if (filters?.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    return prisma.product.findMany({
        where,
        include: {
            store: { select: { id: true, name: true } },
            category: true,
            inventory: { select: { quantity: true } },
            images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getVendorProducts(userId: string) {
    const store = await getUserStore(userId);

    return prisma.product.findMany({
        where: { storeId: store.id },
        include: {
            category: true,
            inventory: true,
            images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
    await verifyProductOwnership(productId, userId);

    return prisma.product.update({
        where: { id: productId },
        data: {
            title: input.title,
            description: input.description,
            basePrice: input.basePrice,
            isActive: input.isActive,
            categoryId: input.categoryId,
            images: input.images ? {
                deleteMany: {}, // Remove existing images
                create: input.images.map((url, index) => ({
                    url,
                    isPrimary: index === 0,
                    sortOrder: index,
                })),
            } : undefined,
        },
        include: {
            store: { select: { id: true, name: true } },
            category: true,
            inventory: true,
        },
    });
}

export async function deleteProduct(userId: string, productId: string) {
    await verifyProductOwnership(productId, userId);

    await prisma.product.delete({
        where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
}

export async function updateInventory(userId: string, productId: string, quantity: number) {
    await verifyProductOwnership(productId, userId);

    return prisma.inventory.update({
        where: { productId },
        data: { quantity },
    });
}

export async function getAllCategories() {
    return prisma.category.findMany({
        include: {
            children: true,
            _count: { select: { products: true } },
        },
        where: { parentId: null }, // Only top-level categories
        orderBy: { name: 'asc' },
    });
}
