import { v2 as cloudinary } from "cloudinary";
import path from "path";    

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    secure: true,
  });
  

/**
 * Deletes a video file from Cloudinary using its URL
 * @param {string} videoUrl - The URL of the video to delete
 * @returns {Promise<void>}
 */
const deleteVideoFromCloudinaryByUrl = async (videoUrl) => {
  try {
    // Extract the public_id from the video URL
    const urlParts = new URL(videoUrl);
    const pathname = urlParts.pathname; // Extract the path from the URL
    const publicIdWithExtension = pathname.split("/").slice(-1)[0]; // Get the last part of the path
    const publicId = path.basename(publicIdWithExtension, path.extname(publicIdWithExtension)); // Remove the extension

    const folderPath = pathname.split("/").slice(1, -1).join("/"); // Get folder path if any
    const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

    // Delete the video from Cloudinary
    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: "video",
    });

    console.log("Video deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error deleting video from Cloudinary:", error);
    throw new Error("Failed to delete video from Cloudinary");
  }
};

export {deleteVideoFromCloudinaryByUrl};
