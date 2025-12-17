import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';

const router = Router();

// Validation schemas
const signupSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    captchaToken: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    captchaToken: z.string().optional(),
});

// POST /api/v1/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const validatedData = signupSchema.parse(req.body);
        const result = await authService.signup(validatedData);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: result,
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
            message: error.message || 'Signup failed',
        });
    }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const result = await authService.login(validatedData);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors,
            });
        }
        res.status(401).json({
            success: false,
            message: error.message || 'Login failed',
        });
    }
});

export default router;
