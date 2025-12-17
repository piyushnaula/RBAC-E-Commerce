import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAuditLogInput {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

export async function createAuditLog(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
        data: {
            userId: input.userId,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId,
            oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
            newValue: input.newValue ? JSON.stringify(input.newValue) : null,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
    });
}

export async function getAuditLogs(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
    });
}
