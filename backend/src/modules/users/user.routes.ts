import { Router, Request, Response } from 'express';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as userService from './user.service';

const router = Router();

// GET /api/v1/users/me - Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await userService.getCurrentUser(req.user!.userId);
        res.json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'User not found',
        });
    }
});

// GET /api/v1/users - Get all users (Admin only)
router.get('/', authMiddleware, requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users',
        });
    }
});

export default router;
