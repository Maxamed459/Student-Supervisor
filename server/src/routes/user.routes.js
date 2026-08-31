import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  assignSupervisor,
} from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate);

// FR-A1
router.post(
  '/',
  authorize('admin'),
  [
    body('fullName').notEmpty(),
    body('email').isEmail(),
    body('role').isIn(['admin', 'supervisor', 'student']),
  ],
  validate,
  createUser
);

router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin'), getUser);

// FR-A1, FR-A4
router.patch('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// FR-A3
router.post(
  '/:id/assign-supervisor',
  authorize('admin'),
  [body('supervisorId').notEmpty()],
  validate,
  assignSupervisor
);

export default router;
