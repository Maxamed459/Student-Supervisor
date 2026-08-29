import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getUploadSignature } from '../controllers/upload.controller.js';

const router = Router();

router.use(authenticate);

// FR-C2, Section 7
router.post('/signature', authorize('supervisor', 'student', 'admin'), getUploadSignature);

export default router;
