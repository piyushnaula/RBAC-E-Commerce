import { Router, Request, Response } from 'express';
import authMiddleware from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import * as auditService from './audit.service';

const router = Router();

// GET /api/v1/audit - Get audit logs (Admin only)
router.get('/', authMiddleware, requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        const filters = {
            userId: req.query.userId as string | undefined,
            entity: req.query.entity as string | undefined,
            entityId: req.query.entityId as string | undefined,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        };

        const logs = await auditService.getAuditLogs(filters);
        res.json({
            success: true,
            data: logs,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch audit logs',
        });
    }
});

export default router;
