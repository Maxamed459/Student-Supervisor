const express = require("express");

const {
  getSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  getSupervisorCapacity,
  getMySupervisor,
} = require("../controllers/supervisorController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Admin list
router.get(
  "/",
  protect,
  authorize("admin"),
  getSupervisors
);

// Logged-in supervisor profile (before /:id)
router.get(
  "/me",
  protect,
  authorize("supervisor"),
  getMySupervisor
);

// Capacity before /:id
router.get(
  "/:id/capacity",
  protect,
  authorize("admin", "supervisor"),
  getSupervisorCapacity
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getSupervisorById
);

router.post(
  "/",
  protect,
  authorize("admin"),
  createSupervisor
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateSupervisor
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteSupervisor
);

module.exports = router;
