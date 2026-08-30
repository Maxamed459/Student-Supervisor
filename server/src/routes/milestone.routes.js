import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createMilestone,
  listMilestones,
  getMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestone.controller.js';
import { listSubmissionsForMilestone } from '../controllers/submission.controller.js';

const router = Router();

router.use(authenticate);

// FR-S2
router.post('/', authorize('supervisor'), [body('title').notEmpty()], validate, createMilestone);

router.get('/', authorize('admin', 'supervisor', 'student'), listMilestones);
router.get('/:id', authorize('admin', 'supervisor', 'student'), getMilestone);
router.patch('/:id', authorize('supervisor', 'admin'), updateMilestone);
router.delete('/:id', authorize('supervisor', 'admin'), deleteMilestone);

// FR-S3
router.get('/:id/submissions', authorize('supervisor', 'admin'), listSubmissionsForMilestone);

export default router;
