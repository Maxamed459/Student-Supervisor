import cloudinary from '../config/cloudinary.js';

/**
 * Generates a signed payload allowing the client to upload a file directly
 * to Cloudinary without exposing the API secret (Section 7 of the plan).
 */
export const generateUploadSignature = ({ folder }) => {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
};

export const destroyAsset = async (publicId, resourceType = 'raw') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

export default { generateUploadSignature, destroyAsset };
