import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upladOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
const generateAccessTokenandRefreshToken = async(userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave: false});
      return {accessToken, refreshToken};
   } catch (error) {
      throw new ApiError(500, "Error generating tokens");
   }
}


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
 const avatarLocalPath = req.files.avatar[0].path;
 //const coverImageLocalPath = req.files.coverImage[0].path;
 let coverImageLocalPath;
 if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)) {
    coverImageLocalPath = req.files.coverImage[0].path;
   }

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
    coverImage: coverImage.url,
    email,
    password,
    username: username.toLowerCase() 

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
const loginUser = asyncHandler( async(req,res) => {
   //take data from req body
   //username or email 
   //find the user
   //compare password
   // access and refresh token sending
   //send response to frontend and send cookies
   const { username, password,  email } = req.body;
   if(!username && !email) {
      throw new ApiError(400, "Please provide username and email");
   }
   
   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   if(!user){
      throw new ApiError(404, "User not found");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);
   if(!isPasswordValid){
      throw new ApiError(401, "Invalid password");
   }
   
   const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id);
   
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
      httpOnly: true,
      secure: true,
   }

   return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
      new ApiResponse(200, {
         user: loggedInUser, accessToken, refreshToken
      },
   "User logged in successfully"
   )
   )


});

const logoutUser = asyncHandler( async(req,res) => {
   await User.findByIdAndUpdate(req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new:true
      }
   )

   const options = {\
      httpOnly: true,
      secure: true
   }
   return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"));
})


export {
    registerUser,
    loginUser,
    logoutUser,
   }