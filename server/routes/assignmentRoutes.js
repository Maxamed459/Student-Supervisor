const express = require("express");

const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSupervisorAssignments,
  getStudentAssignment,
} = require("../controllers/assignmentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ASSIGNMENT ROUTES
// Base URL: /api/assignments
// =====================================================

// Admin: list all
router.get(
  "/",
  protect,
  authorize("admin"),
  getAssignments
);

// Nested reads MUST come before /:id
// Admin: any | Supervisor: own
router.get(
  "/supervisor/:supervisorId",
  protect,
  authorize("admin", "supervisor"),
  getSupervisorAssignments
);

// Admin: any | Student: own
router.get(
  "/student/:studentId",
  protect,
  authorize("admin", "student"),
  getStudentAssignment
);

// Admin: get by id
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getAssignmentById
);

// Admin: mutate
router.post(
  "/",
  protect,
  authorize("admin"),
  createAssignment
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateAssignment
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteAssignment
);

module.exports = router;
