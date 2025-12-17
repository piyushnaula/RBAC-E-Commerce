import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import rbacRoutes from './modules/rbac/rbac.routes';
import vendorRoutes from './modules/vendors/vendor.routes';
import vendorOrderRoutes from './modules/vendors/vendor-orders.routes';
import productRoutes from './modules/products/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/order.routes';
import paymentRoutes from './modules/payments/payment.routes';
import refundRoutes from './modules/refunds/refund.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Rate limiting - General
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting - Auth (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: { success: false, message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(generalLimiter);

// Health check (no rate limit)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files (uploads)
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes); // Stricter rate limit for auth
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rbac', rbacRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/vendor-orders', vendorOrderRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/audit', auditRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api/v1`);
    console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
});
