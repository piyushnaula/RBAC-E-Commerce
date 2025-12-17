import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Extract roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [...new Set(
        user.userRoles.flatMap(ur =>
            ur.role.permissions.map(rp => rp.permission.name)
        )
    )];

    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        roles,
        permissions,
    };
}

export async function getAllUsers() {
    const users = await prisma.user.findMany({
        include: {
            userRoles: {
                include: { role: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        roles: user.userRoles.map(ur => ur.role.name),
    }));
}
