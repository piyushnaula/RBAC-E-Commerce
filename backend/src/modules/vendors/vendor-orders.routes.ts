import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as vendorOrderService from './vendor-orders.service';

const router = Router();

// Validation
const updateStatusSchema = z.object({
    status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// GET /api/v1/vendor-orders - Get vendor's orders
router.get('/', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string | undefined;
        const orders = await vendorOrderService.getVendorOrders(
            req.user!.userId,
            status as any
        );
        res.json({
            success: true,
            data: orders,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to fetch orders',
        });
    }
});

// GET /api/v1/vendor-orders/:id - Get order details
router.get('/:id', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const order = await vendorOrderService.getVendorOrderDetails(req.user!.userId, req.params.id);
        res.json({
            success: true,
            data: order,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'Order not found',
        });
    }
});

// PATCH /api/v1/vendor-orders/:id/status - Update order status
router.patch('/:id/status', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const { status } = updateStatusSchema.parse(req.body);
        const order = await vendorOrderService.updateOrderStatus(req.user!.userId, req.params.id, status);
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                errors: error.errors,
            });
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update order status',
        });
    }
});

export default router;
