const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Utility function to delete an image from Cloudinary.
 * @param {string} publicId - The public ID of the image to delete.
 * @returns {Promise<object>} - Result of the deletion.
 */
const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Image deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Could not delete image from Cloudinary');
  }
};

module.exports = deleteImageFromCloudinary;
