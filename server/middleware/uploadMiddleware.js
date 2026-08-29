const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mimeOk = allowedMimeTypes.has(file.mimetype);
    const extOk = allowedExtensions.has(ext);

    if (mimeOk || extOk) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, PNG, JPG, WEBP"
      )
    );
  },
});

module.exports = {
  upload,
  MAX_FILE_SIZE,
  allowedMimeTypes,
  allowedExtensions,
};
