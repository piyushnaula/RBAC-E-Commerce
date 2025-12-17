import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as refundService from './refund.service';

const router = Router();

// Validation schemas
const requestRefundSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const processRefundSchema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    adminNotes: z.string().optional(),
});

// POST /api/v1/refunds - Customer requests refund
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const validatedData = requestRefundSchema.parse(req.body);
        const refund = await refundService.requestRefund(req.user!.userId, validatedData);
        res.status(201).json({
            success: true,
            message: 'Refund request submitted',
            data: refund,
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
            message: error.message || 'Failed to request refund',
        });
    }
});

// GET /api/v1/refunds - Get user's refunds
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const refunds = await refundService.getUserRefunds(req.user!.userId);
        res.json({
            success: true,
            data: refunds,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch refunds',
        });
    }
});

// GET /api/v1/refunds/admin - Admin: Get all refunds
router.get('/admin', authMiddleware, requireRole('Admin', 'Finance'), async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string | undefined;
        const refunds = await refundService.getAllRefunds(status as any);
        res.json({
            success: true,
            data: refunds,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch refunds',
        });
    }
});

// GET /api/v1/refunds/:id - Get refund details
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const refund = await refundService.getRefundById(req.params.id);
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund not found',
            });
        }
        res.json({
            success: true,
            data: refund,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch refund',
        });
    }
});

// POST /api/v1/refunds/:id/process - Admin: Process refund
router.post('/:id/process', authMiddleware, requireRole('Admin', 'Finance'), async (req: Request, res: Response) => {
    try {
        const { action, adminNotes } = processRefundSchema.parse(req.body);
        const refund = await refundService.processRefund(
            req.user!.userId,
            req.params.id,
            action,
            adminNotes
        );
        res.json({
            success: true,
            message: `Refund ${action.toLowerCase()}d successfully`,
            data: refund,
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
            message: error.message || 'Failed to process refund',
        });
    }
});

export default router;
