import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getGroupForStudent,
  listStudentsForSupervisor,
  getSupervisorForStudent,
  getAdminDashboard,
} from '../controllers/relationship.controller.js';
import { listMilestonesForStudent } from '../controllers/milestone.controller.js';
import { getStudentProgress, listSubmissionsForStudent } from '../controllers/submission.controller.js';

const router = Router();

// NOTE: this router is mounted at '/' in routes/index.js alongside every other
// resource router, so `authenticate` is applied per-route (not via a blanket
// router.use) — a blanket use() here would intercept every unmatched path in
// the whole API (e.g. typos) and mask them as 401 instead of falling through
// to the 404 handler.

// FR-S1
router.get(
  '/supervisors/:id/students',
  authenticate,
  authorize('admin', 'supervisor'),
  listStudentsForSupervisor
);

// FR-T1
router.get(
  '/students/:id/supervisor',
  authenticate,
  authorize('admin', 'supervisor', 'student'),
  getSupervisorForStudent
);

// Student group details for the shared frontend workspace
router.get(
  '/students/:id/group',
  authenticate,
  authorize('admin', 'supervisor', 'student'),
  getGroupForStudent
);

// FR-T2
router.get(
  '/students/:id/milestones',
  authenticate,
  authorize('admin', 'supervisor', 'student'),
  listMilestonesForStudent
);

// FR-S8, FR-T7
router.get(
  '/students/:id/progress',
  authenticate,
  authorize('admin', 'supervisor', 'student'),
  getStudentProgress
);

// FR-T5, FR-T7 — student's own submissions across all milestones
router.get(
  '/students/:id/submissions',
  authenticate,
  authorize('admin', 'supervisor', 'student'),
  listSubmissionsForStudent
);

// FR-A5, FR-A6
router.get('/admin/dashboard', authenticate, authorize('admin'), getAdminDashboard);

export default router;
