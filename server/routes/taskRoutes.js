const express = require("express");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
} = require("../controllers/taskController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/stats",
  protect,
  authorize("supervisor", "admin"),
  getTaskStats
);

router.get(
  "/",
  protect,
  authorize("student", "supervisor", "admin"),
  getTasks
);

router.post(
  "/",
  protect,
  authorize("supervisor", "admin"),
  createTask
);

router.get(
  "/:id",
  protect,
  authorize("student", "supervisor", "admin"),
  getTaskById
);

router.put(
  "/:id",
  protect,
  authorize("student", "supervisor", "admin"),
  updateTask
);

router.delete(
  "/:id",
  protect,
  authorize("supervisor", "admin"),
  deleteTask
);

module.exports = router;
