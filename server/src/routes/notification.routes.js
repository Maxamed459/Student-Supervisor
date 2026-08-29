import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticate);

// FR-T10
router.get('/', listNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
