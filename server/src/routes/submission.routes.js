import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createOrResubmit,
  listSubmissions,
  getSubmission,
  updateSubmission,
  deleteSubmission,
  approveSubmission,
  requestChanges,
  addComment,
} from '../controllers/submission.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'supervisor', 'student'), listSubmissions);

// FR-T3, FR-T4
router.post(
  '/',
  authorize('student'),
  [body('milestoneId').notEmpty(), body('files').isArray({ min: 1 })],
  validate,
  createOrResubmit
);

// FR-S4
router.get('/:id', authorize('admin', 'supervisor', 'student'), getSubmission);
router.patch('/:id', authorize('student', 'admin'), updateSubmission);
router.delete('/:id', authorize('student', 'admin'), deleteSubmission);

// FR-S5
router.patch('/:id/approve', authorize('supervisor'), approveSubmission);

// FR-S6
router.patch(
  '/:id/request-changes',
  authorize('supervisor'),
  [body('comment').notEmpty().withMessage('A comment is required when requesting changes')],
  validate,
  requestChanges
);

// FR-S7, FR-T6
router.post(
  '/:id/comments',
  authorize('supervisor', 'student'),
  [body('content').notEmpty()],
  validate,
  addComment
);

export default router;
