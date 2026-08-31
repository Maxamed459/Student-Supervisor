import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateUploadSignature } from '../services/cloudinary.service.js';

// POST /api/uploads/signature — signed direct-to-Cloudinary upload (Section 7, FR-C2)
export const getUploadSignature = asyncHandler(async (req, res) => {
  const { folder } = req.body;
  if (!folder) throw new ApiError(400, 'folder is required (e.g. "submissions", "milestones").');

  const allowedFolders = ['submissions', 'milestones', 'avatars'];
  if (!allowedFolders.includes(folder)) {
    throw new ApiError(400, `folder must be one of: ${allowedFolders.join(', ')}`);
  }

  const scopedFolder = `student-supervisor/${folder}/${req.user._id}`;
  const payload = generateUploadSignature({ folder: scopedFolder });

  res.status(200).json(new ApiResponse(200, payload, 'Upload signature generated'));
});
