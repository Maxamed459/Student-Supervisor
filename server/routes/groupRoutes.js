const express = require("express");

const {
  getGroups,
  getMyGroups,
  getGroupById,
  createGroup,
  updateGroup,
  assignSupervisor,
  addMembers,
  removeMember,
  deleteGroup,
} = require("../controllers/groupController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Logged-in supervisor/student groups (admin can also call this)
router.get(
  "/me",
  protect,
  authorize("admin", "supervisor", "student"),
  getMyGroups
);

// Admin list
router.get(
  "/",
  protect,
  authorize("admin"),
  getGroups
);

// Shared read with ownership checks in controller
router.get(
  "/:id",
  protect,
  authorize("admin", "supervisor", "student"),
  getGroupById
);

// Admin mutations
router.post(
  "/",
  protect,
  authorize("admin"),
  createGroup
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateGroup
);

router.put(
  "/:id/supervisor",
  protect,
  authorize("admin"),
  assignSupervisor
);

router.post(
  "/:id/members",
  protect,
  authorize("admin"),
  addMembers
);

router.delete(
  "/:id/members/:studentId",
  protect,
  authorize("admin"),
  removeMember
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteGroup
);

module.exports = router;
