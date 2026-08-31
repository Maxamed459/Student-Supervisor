import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
} from '../controllers/group.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin'), [body('name').notEmpty()], validate, createGroup);
router.get('/', authorize('admin', 'supervisor', 'student'), listGroups);
router.get('/:id', authorize('admin', 'supervisor', 'student'), getGroup);
router.patch('/:id', authorize('admin'), updateGroup);
router.delete('/:id', authorize('admin'), deleteGroup);

// Group membership management
router.post(
  '/:id/members',
  authorize('admin'),
  [body('userId').notEmpty()],
  validate,
  addGroupMember
);
router.delete(
  '/:id/members/:userId',
  authorize('admin'),
  removeGroupMember
);

export default router;
