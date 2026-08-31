const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Any logged-in user
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authorized",
    data: req.user,
    user: req.user,
  });
});

// Admin only
router.get("/admin-dashboard", protect, authorize("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
});

// Supervisor only
router.get(
  "/supervisor-dashboard",
  protect,
  authorize("supervisor"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Supervisor",
    });
  }
);

// Student only
router.get(
  "/student-dashboard",
  protect,
  authorize("student"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Student",
    });
  }
);

module.exports = router;
