import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"

const getChannelStates = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;
    
    const totalVideos = await Video.countDocuments({ owner: userId });
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });
     // Total Likes
     const totalLikesData = await Like.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalLikes: { $sum: 1 } } }
    ]);
    const totalLikes = totalLikesData.length > 0 ? totalLikesData[0].totalLikes : 0;
      // Total Views
      const totalViewsData = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = totalViewsData.length > 0 ? totalViewsData[0].totalViews : 0;
    res.status(200).json(new ApiResponse(200, {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes
    }, "Channel statistics fetched successfully"));


});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(videos, 200, "Videos fetched successfully"));
});

export {
    getChannelStates, 
    getChannelVideos
    }