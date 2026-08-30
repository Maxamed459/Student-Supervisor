import { Router } from 'express';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import groupRoutes from './group.routes.js';
import milestoneRoutes from './milestone.routes.js';
import submissionRoutes from './submission.routes.js';
import uploadRoutes from './upload.routes.js';
import notificationRoutes from './notification.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import settingsRoutes from './settings.routes.js';
import meRoutes from './me.routes.js';
import relationshipRoutes from './relationship.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/submissions', submissionRoutes);
router.use('/uploads', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/me', meRoutes);
router.use('/', relationshipRoutes); // /supervisors/:id/students, /students/:id/..., /admin/dashboard

export default router;
