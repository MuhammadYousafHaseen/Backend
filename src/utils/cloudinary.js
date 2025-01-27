import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
  secure: true,
});

const upladOnCloudinary = async localFilePath => {
  try {
    if (!localFilePath) return null;
    // uploading file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //files has been uploaded successfully
    // console.log("File has been uploaded successfully" , response);
    fs.unlinkSync(localFilePath);
    return response; // return response.url;
  } catch (error) {
    fs.unlinkSync(localFilePath); // delete file from local storage if any error
    return null; // return null;
  }
};

export { upladOnCloudinary };
