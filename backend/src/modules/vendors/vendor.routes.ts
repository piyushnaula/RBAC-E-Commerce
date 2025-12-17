import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as vendorService from './vendor.service';

const router = Router();

// Validation schema
const createVendorSchema = z.object({
    legalName: z.string().min(2, 'Legal name must be at least 2 characters'),
    businessType: z.string().min(1, 'Business type is required'),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    storeName: z.string().min(2, 'Store name must be at least 2 characters'),
    storeDescription: z.string().optional(),
});

// POST /api/v1/vendors - Create vendor (requires Merchant role)
router.post('/', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const validatedData = createVendorSchema.parse(req.body);
        const vendor = await vendorService.createVendor({
            userId: req.user!.userId,
            ...validatedData,
        });
        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            data: vendor,
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
            message: error.message || 'Failed to create vendor',
        });
    }
});

// GET /api/v1/vendors/me - Get current user's vendor
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const vendor = await vendorService.getVendorByUserId(req.user!.userId);
        res.json({
            success: true,
            data: vendor,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'Vendor not found',
        });
    }
});

// PATCH /api/v1/vendors/me - Update current user's vendor
router.patch('/me', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const vendor = await vendorService.updateVendor(req.user!.userId, req.body);
        res.json({
            success: true,
            message: 'Vendor updated successfully',
            data: vendor,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update vendor',
        });
    }
});

// GET /api/v1/vendors - Get all vendors (Admin only)
router.get('/', authMiddleware, requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        const vendors = await vendorService.getAllVendors();
        res.json({
            success: true,
            data: vendors,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch vendors',
        });
    }
});

export default router;
