import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to check if user has required role
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.roles) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

// Middleware to check if user has required permission
export function requirePermission(permissionName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            // Get all permissions for user's roles
            const userRoles = await prisma.userRole.findMany({
                where: { userId: req.user.userId },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            });

            const userPermissions = userRoles.flatMap(ur =>
                ur.role.permissions.map(rp => rp.permission.name)
            );

            if (!userPermissions.includes(permissionName)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required permission: ${permissionName}`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error checking permissions' });
        }
    };
}
