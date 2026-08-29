const express = require("express");

const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getMyStudent,
} = require("../controllers/studentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  getStudents
);

// Logged-in student profile (before /:id)
router.get(
  "/me",
  protect,
  authorize("student"),
  getMyStudent
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getStudentById
);

router.post(
  "/",
  protect,
  authorize("admin"),
  createStudent
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateStudent
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteStudent
);

module.exports = router;
