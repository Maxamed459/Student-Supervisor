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
} from '../controllers/group.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin'), [body('name').notEmpty()], validate, createGroup);
router.get('/', authorize('admin', 'supervisor'), listGroups);
router.get('/:id', authorize('admin', 'supervisor'), getGroup);
router.patch('/:id', authorize('admin'), updateGroup);
router.delete('/:id', authorize('admin'), deleteGroup);

export default router;
