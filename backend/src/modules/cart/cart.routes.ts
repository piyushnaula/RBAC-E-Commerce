import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import * as cartService from './cart.service';

const router = Router();

// Validation schemas
const addToCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive().optional().default(1),
});

const updateCartItemSchema = z.object({
    quantity: z.number().int().min(0),
});

// GET /api/v1/cart - Get current user's cart
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const cart = await cartService.getCart(req.user!.userId);
        res.json({
            success: true,
            data: cart,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch cart',
        });
    }
});

// POST /api/v1/cart/items - Add item to cart
router.post('/items', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { productId, quantity } = addToCartSchema.parse(req.body);
        const cart = await cartService.addToCart(req.user!.userId, productId, quantity);
        res.json({
            success: true,
            message: 'Item added to cart',
            data: cart,
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
            message: error.message || 'Failed to add item to cart',
        });
    }
});

// PATCH /api/v1/cart/items/:id - Update cart item quantity
router.patch('/items/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { quantity } = updateCartItemSchema.parse(req.body);
        const cart = await cartService.updateCartItem(req.user!.userId, req.params.id, quantity);
        res.json({
            success: true,
            message: 'Cart updated',
            data: cart,
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
            message: error.message || 'Failed to update cart',
        });
    }
});

// DELETE /api/v1/cart/items/:id - Remove item from cart
router.delete('/items/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const cart = await cartService.removeFromCart(req.user!.userId, req.params.id);
        res.json({
            success: true,
            message: 'Item removed from cart',
            data: cart,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to remove item',
        });
    }
});

// DELETE /api/v1/cart - Clear cart
router.delete('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await cartService.clearCart(req.user!.userId);
        res.json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to clear cart',
        });
    }
});

export default router;
