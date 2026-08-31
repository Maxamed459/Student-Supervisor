const express = require("express");
const {
  uploadDocument,
  resubmitDocument,
  getDocuments,
  getDocumentStats,
  getDocumentById,
  downloadDocument,
  reviewDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { upload } = require("../middleware/uploadMiddleware");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/stats",
  protect,
  authorize("supervisor", "admin"),
  getDocumentStats
);

router.get(
  "/",
  protect,
  authorize("student", "supervisor", "admin"),
  getDocuments
);

router.post(
  "/",
  protect,
  authorize("student"),
  upload.single("file"),
  uploadDocument
);

router.get(
  "/:id/download",
  protect,
  authorize("student", "supervisor", "admin"),
  downloadDocument
);

router.put(
  "/:id/resubmit",
  protect,
  authorize("student"),
  upload.single("file"),
  resubmitDocument
);

router.get(
  "/:id",
  protect,
  authorize("student", "supervisor", "admin"),
  getDocumentById
);

router.put(
  "/:id/review",
  protect,
  authorize("supervisor", "admin"),
  reviewDocument
);

router.delete(
  "/:id",
  protect,
  authorize("student", "supervisor", "admin"),
  deleteDocument
);

module.exports = router;
