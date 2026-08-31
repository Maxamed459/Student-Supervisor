const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// All department routes are Admin only

router.post(
  "/",
  protect,
  authorize("admin"),
  createDepartment
);

router.get(
  "/",
  protect,
  authorize("admin"),
  getDepartments
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getDepartmentById
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateDepartment
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDepartment
);

module.exports = router;