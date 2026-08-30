import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listAuditLogs } from '../controllers/auditLog.controller.js';

const router = Router();

router.use(authenticate);

// FR-C3
router.get('/', authorize('admin'), listAuditLogs);

export default router;
