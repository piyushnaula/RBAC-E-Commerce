import { Request, Response, NextFunction } from 'express';

// Sanitize input to prevent NoSQL injection and XSS
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
            // Remove potential XSS characters
            return obj
                .replace(/[<>]/g, '')
                .replace(/\$/g, '')
                .trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const key of Object.keys(obj)) {
                // Skip keys that start with $ (MongoDB operators)
                if (!key.startsWith('$')) {
                    sanitized[key] = sanitize(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
}

// Validate content type for JSON endpoints
export function requireJson(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                success: false,
                message: 'Content-Type must be application/json',
            });
        }
    }
    next();
}

// Security headers for API responses
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent caching of sensitive data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Additional security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');

    next();
}
