import { PrismaClient } from '@prisma/client';
import * as auditService from '../audit/audit.service';

const prisma = new PrismaClient();

export async function getAllRoles() {
    return prisma.role.findMany({
        include: {
            permissions: {
                include: { permission: true },
            },
        },
    });
}

export async function assignRoleToUser(adminUserId: string, userId: string, roleName: string) {
    // Find the role
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
        throw new Error(`Role '${roleName}' not found`);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }

    // Check if already assigned
    const existing = await prisma.userRole.findUnique({
        where: {
            userId_roleId: { userId, roleId: role.id },
        },
    });

    if (existing) {
        throw new Error(`User already has role '${roleName}'`);
    }

    // Assign role
    await prisma.userRole.create({
        data: {
            userId,
            roleId: role.id,
        },
    });

    // Audit log
    await auditService.createAuditLog({
        userId: adminUserId,
        action: 'USER_ROLE_ASSIGNED',
        entity: 'User',
        entityId: userId,
        newValue: { role: roleName, targetUserId: userId },
    });

    return { message: `Role '${roleName}' assigned to user successfully` };
}

export async function removeRoleFromUser(adminUserId: string, userId: string, roleName: string) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
        throw new Error(`Role '${roleName}' not found`);
    }

    const userRole = await prisma.userRole.findUnique({
        where: {
            userId_roleId: { userId, roleId: role.id },
        },
    });

    if (!userRole) {
        throw new Error(`User does not have role '${roleName}'`);
    }

    await prisma.userRole.delete({
        where: { id: userRole.id },
    });

    // Audit log
    await auditService.createAuditLog({
        userId: adminUserId,
        action: 'USER_ROLE_REMOVED',
        entity: 'User',
        entityId: userId,
        oldValue: { role: roleName, targetUserId: userId },
    });

    return { message: `Role '${roleName}' removed from user successfully` };
}
