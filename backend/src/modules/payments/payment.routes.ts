import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import * as paymentService from './payment.service';

const router = Router();

// Validation schemas
const createPaymentOrderSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
});

const verifyPaymentSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
});

// POST /api/v1/payments/create-order - Create Razorpay order
router.post('/create-order', authMiddleware, async (req: Request, res: Response) => {
    try {
        const validatedData = createPaymentOrderSchema.parse(req.body);
        const paymentOrder = await paymentService.createPaymentOrder(req.user!.userId, validatedData);
        res.json({
            success: true,
            data: paymentOrder,
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
            message: error.message || 'Failed to create payment order',
        });
    }
});

// POST /api/v1/payments/verify - Verify payment
router.post('/verify', authMiddleware, async (req: Request, res: Response) => {
    try {
        const validatedData = verifyPaymentSchema.parse(req.body);
        const result = await paymentService.verifyPayment(req.user!.userId, validatedData);
        res.json({
            success: true,
            message: result.message,
            data: {
                orderId: result.orderId,
                orderNumber: result.orderNumber,
            },
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
            message: error.message || 'Payment verification failed',
        });
    }
});

// GET /api/v1/payments/status/:orderId - Get payment status
router.get('/status/:orderId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const status = await paymentService.getPaymentStatus(req.user!.userId, req.params.orderId);
        res.json({
            success: true,
            data: status,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'Order not found',
        });
    }
});

export default router;
