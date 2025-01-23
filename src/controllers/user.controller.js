import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upladOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from F"../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req, res) => {
   //get user details from frontend but we will use postman
   //validation of user inputs fields - not empty
   //check if user already exists : email username
   //check for avatar and images
   // upload to cloudinary, avatar checking
   //create user object - create entry in db
   //remove password and refresh token field from response
   //check response for user creation
   //send response to frontend or return error message
   const { fullname, username, password, email } = req.body;
//    console.log(email, fullname, username, password);
if(
    [fullname, email, username,password].some((field) => field?.trim() === '')
){
    throw new ApiError(400, "Please fill all fields");
}

const existedUser= await User.findOne({
    $or: [{ email }, { username }]
 })
 if(existedUser){
    throw new ApiError(409, "Username or email already exists");
 }
 const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;

 if(!avatarLocalPath || !coverImageLocalPath){
    throw new ApiError(400, "Please upload avatar and cover image");
 }
  const avatar = await upladOnCloudinary(avatarLocalPath);
  const coverImage = await upladOnCloudinary(coverImageLocalPath);
  if(!avatar || !coverImage){
    throw new ApiError(500, "Error uploading images");
 }
 const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.lowercase() 

 })

 const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Error in registering a user means you bro!")
}

return res.status(201).json(
    new ApiResponse(200, "User created successfully", createdUser)
)


});
export { registerUser }