const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("student", "supervisor", "admin"),
  getMeetings
);

router.post(
  "/",
  protect,
  authorize("supervisor", "admin"),
  createMeeting
);

router.get(
  "/:id",
  protect,
  authorize("student", "supervisor", "admin"),
  getMeetingById
);

router.put(
  "/:id",
  protect,
  authorize("supervisor", "admin"),
  updateMeeting
);

router.delete(
  "/:id",
  protect,
  authorize("supervisor", "admin"),
  deleteMeeting
);

module.exports = router;
