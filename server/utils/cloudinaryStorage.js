const path = require("path");
const cloudinary = require("../config/cloudinary");

const isImageMime = (mime = "") => mime.startsWith("image/");

const isImageFile = (file = {}) => {
  if (isImageMime(file.mimetype)) return true;
  const ext = path.extname(file.originalname || "").toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext);
};

const resolveResourceType = (file) => (isImageFile(file) ? "image" : "raw");

const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type || "raw",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  if (!publicId) return null;

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "raw",
      invalidate: true,
    });
  } catch (error) {
    const fallbacks = ["raw", "image", "video"].filter(
      (type) => type !== (resourceType || "raw")
    );

    for (const type of fallbacks) {
      try {
        return await cloudinary.uploader.destroy(publicId, {
          resource_type: type,
          invalidate: true,
        });
      } catch (_) {
        // try next resource type
      }
    }

    console.error("Cloudinary delete failed:", error.message || error);
    throw error;
  }
};

const buildDocumentFolder = (documentType) =>
  `student-supervisor/documents/${documentType || "other"}`;

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  buildDocumentFolder,
  resolveResourceType,
  isImageFile,
};
