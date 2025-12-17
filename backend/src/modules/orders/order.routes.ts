import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import * as orderService from './order.service';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
    addressId: z.string().uuid('Invalid address ID'),
    notes: z.string().optional(),
});

const addAddressSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(5),
    isDefault: z.boolean().optional(),
});

// GET /api/v1/orders - Get user's orders
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const orders = await orderService.getUserOrders(req.user!.userId);
        res.json({
            success: true,
            data: orders,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch orders',
        });
    }
});

// GET /api/v1/orders/:id - Get order details
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const order = await orderService.getOrderById(req.user!.userId, req.params.id);
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

// POST /api/v1/orders - Create order from cart
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const validatedData = createOrderSchema.parse(req.body);
        const order = await orderService.createOrder(req.user!.userId, validatedData);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,
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
            message: error.message || 'Failed to create order',
        });
    }
});

// GET /api/v1/orders/addresses/list - Get user's addresses
router.get('/addresses/list', authMiddleware, async (req: Request, res: Response) => {
    try {
        const addresses = await orderService.getUserAddresses(req.user!.userId);
        res.json({
            success: true,
            data: addresses,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch addresses',
        });
    }
});

// POST /api/v1/orders/addresses - Add new address
router.post('/addresses', authMiddleware, async (req: Request, res: Response) => {
    try {
        const validatedData = addAddressSchema.parse(req.body);
        const address = await orderService.addAddress(req.user!.userId, validatedData);
        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: address,
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
            message: error.message || 'Failed to add address',
        });
    }
});

export default router;
