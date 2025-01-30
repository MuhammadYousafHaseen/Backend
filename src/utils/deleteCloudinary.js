import { v2 as cloudinary } from "cloudinary";

// Ensure Cloudinary is configured with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
  secure: true,
});

/**
 * Deletes an image from Cloudinary using its URL.
 * @param {string} imageUrl - The full URL of the image to be deleted.
 * @returns {Promise<Object>} - The response from Cloudinary.
 */
const deleteImageFromCloudinary = async imageUrl => {
  try {
    if (!imageUrl) {
      throw new Error("Image URL is required.");
    }

    // Extract the public_id from the URL
    const urlParts = imageUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1]; // Get the last part (e.g., "filename.jpg")
    const publicId = publicIdWithExtension.split(".")[0]; // Remove the extension (e.g., "filename")

    // Delete the image using Cloudinary's destroy method
    const result = await cloudinary.uploader.destroy(publicId);

    console.log("Image deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

export { deleteImageFromCloudinary };
