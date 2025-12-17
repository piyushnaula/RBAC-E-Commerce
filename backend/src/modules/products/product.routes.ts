import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { upload } from '../../middleware/upload.middleware';
import * as productService from './product.service';
import multer from 'multer'; // Import multer to ensure types are registered

interface MulterRequest extends Request {
    files?: Express.Multer.File[];
}

const router = Router();

// Validation schemas
const createProductSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    basePrice: z.number().positive('Price must be positive'),
    sku: z.string().min(1, 'SKU is required'),
    categoryId: z.string().uuid().optional(),
    quantity: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).optional(),
});

const updateProductSchema = z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    basePrice: z.number().positive().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    images: z.array(z.string().url()).optional(),
});

// GET /api/v1/products - Get all products (public)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { categoryId, storeId, search } = req.query;
        const products = await productService.getAllProducts({
            categoryId: categoryId as string,
            storeId: storeId as string,
            search: search as string,
        });
        res.json({
            success: true,
            data: products,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch products',
        });
    }
});

// GET /api/v1/products/categories - Get all categories
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const categories = await productService.getAllCategories();
        res.json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch categories',
        });
    }
});

// GET /api/v1/products/vendor - Get vendor's products
router.get('/vendor', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const products = await productService.getVendorProducts(req.user!.userId);
        res.json({
            success: true,
            data: products,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to fetch vendor products',
        });
    }
});

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.json({
            success: true,
            data: product,
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'Product not found',
        });
    }
});

// POST /api/v1/products - Create product (Merchant only)
router.post('/',
    authMiddleware,
    requireRole('Merchant', 'Admin'),
    upload.array('images', 5), // Max 5 images
    async (req: Request, res: Response) => {
        try {
            // Parse non-string fields manually since multipart/form-data sends everything as strings
            const rawBody = { ...req.body };
            if (rawBody.basePrice) rawBody.basePrice = parseFloat(rawBody.basePrice);
            if (rawBody.quantity) rawBody.quantity = parseInt(rawBody.quantity);

            const validatedData = createProductSchema.parse(rawBody);

            // Cast req to any to access files, or better, use the interface if we could switch signature
            const files = (req as unknown as MulterRequest).files;
            const imageUrls = files?.map(file => `/uploads/${file.filename}`) || [];

            const product = await productService.createProduct(req.user!.userId, {
                storeId: req.body.storeId,
                ...validatedData,
                images: imageUrls,
            });

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product,
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
                message: error.message || 'Failed to create product',
            });
        }
    });

// PATCH /api/v1/products/:id - Update product (ownership check)
router.patch('/:id',
    authMiddleware,
    requireRole('Merchant', 'Admin'),
    upload.array('images', 5),
    async (req: Request, res: Response) => {
        try {
            // Parse numeric/boolean fields
            const rawBody = { ...req.body };
            if (rawBody.basePrice) rawBody.basePrice = parseFloat(rawBody.basePrice);
            if (rawBody.isActive !== undefined) rawBody.isActive = rawBody.isActive === 'true';

            // Zod schema validation
            const validatedData = updateProductSchema.parse(rawBody);

            const files = (req as unknown as MulterRequest).files;
            let imageUrls: string[] | undefined;

            if (files && files.length > 0) {
                imageUrls = files.map(file => `/uploads/${file.filename}`);
            }

            const product = await productService.updateProduct(req.user!.userId, req.params.id, {
                ...validatedData,
                images: imageUrls,
            });

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: product,
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
                message: error.message || 'Failed to update product',
            });
        }
    });

// DELETE /api/v1/products/:id - Delete product (ownership check)
router.delete('/:id', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const result = await productService.deleteProduct(req.user!.userId, req.params.id);
        res.json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete product',
        });
    }
});

// PATCH /api/v1/products/:id/inventory - Update inventory
router.patch('/:id/inventory', authMiddleware, requireRole('Merchant', 'Admin'), async (req: Request, res: Response) => {
    try {
        const { quantity } = req.body;
        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required',
            });
        }
        const inventory = await productService.updateInventory(req.user!.userId, req.params.id, quantity);
        res.json({
            success: true,
            message: 'Inventory updated successfully',
            data: inventory,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update inventory',
        });
    }
});

export default router;
