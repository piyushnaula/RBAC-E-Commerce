import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateVendorInput {
    userId: string;
    legalName: string;
    businessType: string;
    taxId?: string;
    phone?: string;
    address?: string;
    storeName: string;
    storeDescription?: string;
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);
}

export async function createVendor(input: CreateVendorInput) {
    const { userId, legalName, businessType, taxId, phone, address, storeName, storeDescription } = input;

    // Check if user already has a vendor
    const existingVendor = await prisma.vendor.findUnique({ where: { userId } });
    if (existingVendor) {
        throw new Error('User already has a vendor account');
    }

    // Create vendor with store in a transaction
    const vendor = await prisma.vendor.create({
        data: {
            userId,
            legalName,
            businessType,
            taxId,
            phone,
            address,
            store: {
                create: {
                    name: storeName,
                    slug: generateSlug(storeName),
                    description: storeDescription,
                },
            },
        },
        include: {
            store: true,
            user: {
                select: { id: true, email: true },
            },
        },
    });

    return vendor;
}

export async function getVendorByUserId(userId: string) {
    const vendor = await prisma.vendor.findUnique({
        where: { userId },
        include: {
            store: true,
            user: {
                select: { id: true, email: true },
            },
        },
    });

    if (!vendor) {
        throw new Error('Vendor not found');
    }

    return vendor;
}

export async function updateVendor(userId: string, data: Partial<CreateVendorInput>) {
    // Verify ownership
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
        throw new Error('Vendor not found');
    }

    const updated = await prisma.vendor.update({
        where: { userId },
        data: {
            legalName: data.legalName,
            businessType: data.businessType,
            taxId: data.taxId,
            phone: data.phone,
            address: data.address,
        },
        include: {
            store: true,
        },
    });

    return updated;
}

export async function getAllVendors() {
    return prisma.vendor.findMany({
        include: {
            store: true,
            user: {
                select: { id: true, email: true },
            },
        },
    });
}
