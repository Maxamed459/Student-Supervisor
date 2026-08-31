import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';

const router = Router();

router.use(authenticate);

// FR-A7
router.get('/', getSettings);
router.patch('/', authorize('admin'), updateSettings);

export default router;
