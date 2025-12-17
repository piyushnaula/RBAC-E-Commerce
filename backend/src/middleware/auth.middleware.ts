import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, JwtPayload } from '../utils/jwt.util';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload & { roles?: string[] };
        }
    }
}

// Middleware to verify JWT and attach user to request
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Get user's roles
        const userRoles = await prisma.userRole.findMany({
            where: { userId: decoded.userId },
            include: { role: true },
        });

        req.user = {
            ...decoded,
            roles: userRoles.map(ur => ur.role.name),
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

export default authMiddleware;
