import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as rbacService from './rbac.service';

const router = Router();

// Validation schemas
const assignRoleSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    roleName: z.string().min(1, 'Role name is required'),
});

// GET /api/v1/rbac/roles - Get all roles
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
    try {
        const roles = await rbacService.getAllRoles();
        res.json({
            success: true,
            data: roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions.map(rp => rp.permission.name),
            })),
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch roles',
        });
    }
});

// POST /api/v1/rbac/assign-role - Assign role to user (Admin only)
router.post('/assign-role', authMiddleware, requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        const { userId, roleName } = assignRoleSchema.parse(req.body);
        const result = await rbacService.assignRoleToUser(req.user!.userId, userId, roleName);
        res.json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors,
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to assign role',
        });
    }
});

// POST /api/v1/rbac/remove-role - Remove role from user (Admin only)
router.post('/remove-role', authMiddleware, requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        const { userId, roleName } = assignRoleSchema.parse(req.body);
        const result = await rbacService.removeRoleFromUser(req.user!.userId, userId, roleName);
        res.json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors,
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to remove role',
        });
    }
});

export default router;
