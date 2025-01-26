import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upladOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { deleteImageFromCloudinary } from "../utils/deleteCloudinary.js";

const generateAccessTokenandRefreshToken = async userId => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend but we will use postman
  //validation of user inputs fields - not empty
  //check if user already exists : email username
  //check for avatar and images
  // upload to cloudinary, avatar checking
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check response for user creation
  //send response to frontend or return error message
  try {
    const { fullname, username, password, email } = req.body;
    //    console.log(email, fullname, username, password);
    if ([fullname, email, username, password].some(field => field?.trim() === "")) {
      throw new ApiError(400, "Please fill all fields");
    }

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existedUser) {
      throw new ApiError(409, "Username or email already exists");
    }
    const avatarLocalPath = req.files.avatar[0].path;
    //const coverImageLocalPath = req.files.coverImage[0].path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath || !coverImageLocalPath) {
      throw new ApiError(400, "Please upload avatar and cover image");
    }
    var avatar1 = await upladOnCloudinary(avatarLocalPath);
    var coverImage1 = await upladOnCloudinary(coverImageLocalPath);
    if (!avatar1 || !coverImage1) {
      throw new ApiError(500, "Error uploading images");
    }
    const user = await User.create({
      fullname,
      avatar: avatar1.url,
      coverImage: coverImage1.url,
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(500, "Error in registering a user means you bro!");
    }

    return res.status(201).json(new ApiResponse(200, "User created successfully", createdUser));
  } catch (error) {
    throw new ApiError(500, "Error registering user");
  }
});
const loginUser = asyncHandler(async (req, res) => {
  //take data from req body
  //username or email
  //find the user
  //compare password
  // access and refresh token sending
  //send response to frontend and send cookies
  try {
    const { username, password, email } = req.body;
    if (!username && !email) {
      throw new ApiError(400, "Please provide username and email");
    }

    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(500, "Error logging in user");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      },
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(500, "Error logging out user");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Please login first, refresh token not found");
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "User not found, invalid refresh Token");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateAccessTokenandRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Please login first, refresh token not found");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "Please fill all fields");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm new password do not match");
  }

  try {
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid current password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(500, "Error changing password");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    //const user = await User.findById(req.user._id);
    // return res.status(200).json(new ApiResponse(200, user, "Current user fetched successfully")); we commented tis code bcs we are getting user from middleware also ...
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error fetching current user");
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "Please fill all fields");
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullname,
          email,
        },
      },
      {
        new: true,
      },
    ).select("-password -refreshToken"); // we are not updating password and refresh token so we are not selecting them
    if (!updatedUser) {
      throw new ApiError(500, "Error updating account details");
    }
    return res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Error updating account details");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const updatedAvatarLocalPath = req.file?.path;
  if (!updatedAvatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  try {
    const updatedAvatar = await upladOnCloudinary(updatedAvatarLocalPath);
    if (!updatedAvatar) {
      throw new ApiError(500, "Error uploading image");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: updatedAvatar.url,
        },
      },
      {
        new: true,
      },
    ).select("-password -refreshToken"); // we are not updating password and refresh token so we are not selecting them
    if (!updatedUser) {
      throw new ApiError(500, "Error updating avatar");
    }

    await deleteImageFromCloudinary(avatar1.url);

    return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Error updating avatar");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const updatedCoverImageLocalPath = req.file?.path;
  if (!updatedCoverImageLocalPath) {
    throw new ApiError(400, "Please upload a Cover Image");
  }

  try {
    const coverImage = await upladOnCloudinary(updatedCoverImageLocalPath);
    if (!coverImage) {
      throw new ApiError(500, "Error uploading image");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      },
    ).select("-password -refreshToken"); // we are not updating password and refresh token so we are not selecting them
    if (!updatedUser) {
      throw new ApiError(500, "Error updating Cover Image");
    }

    // await deleteImageFromCloudinary(coverImage1.url);

    return res.status(200).json(new ApiResponse(200, updatedUser, "Cover Image updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Error updating Cover Image");
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Please provide username");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: { $cond: { if: { $in: [req.user?._id, "$subscribers.subscriber"] }, then: true, else: false } },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
