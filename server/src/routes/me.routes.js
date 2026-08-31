import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { updateMe } from '../controllers/user.controller.js';

const router = Router();

// FR-C4
router.patch('/', authenticate, updateMe);

export default router;
