import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"


// const toggleVideoLike = asyncHandler(async (req, res) => {
//     const {videoId} = req.params
//     //TODO: toggle like on video
//     if(!videoId || isValidObjectId(videoId)){
//         throw new ApiError(400,"Invalid videoId or missing videoId")
//     }
//     const video = await Video.findById(videoId);
//     if(!video){
//         throw new ApiError(404,"Video not found")
//     }
//     const like = await Like.findOne({video:videoId, user:req.user._id});
//     if(like){
//         await Like.findByIdAndDelete(like._id);
//         video.likes -= 1;
//         await video.save();
//         return res.status(200).json(new ApiResponse(200, "Video unliked successfully"));
//     }
//     const newLike = await Like.create({video:videoId, user:req.user._id});
//     video.likes += 1;
//     await video.save();
//     return res.status(200).json(new ApiResponse(200, "Video liked successfully"));
// })
//optimised code
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing videoId");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if user already liked the video
    const existingLike = await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id });

    if (existingLike) {
        return res.status(200).json(new ApiResponse(null, 200, "Video unliked successfully"));
    }

    // If like does not exist, create a new one
    const newLike = await Like.create({ video: videoId, likedBy: req.user._id });

    return res.status(200).json(new ApiResponse(newLike, 200, "Video liked successfully"));
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId or missing commentId")
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    const existingLike = await Like.findOneAndDelete({ comment: commentId, likedBy: req.user._id });
    if (existingLike) {
        return res.status(200).json(new ApiResponse(null, 200, "Comment unliked successfully"));
    }
    const newLike = await Like.create({ comment: commentId, likedBy: req.user._id });
    return res.status(200).json(new ApiResponse(newLike, 200, "Comment liked successfully"));

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Either tweetId is missing or incorrrect")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400,"Tweet not found")
    }
    const existingLike = await Like.findOneAndDelete({ tweet: tweetId, likedBy: req.user._id });
    if (existingLike) {
        return res.status(200).json(new ApiResponse(null, 200, "Tweet Unliked successfully"));
    }
    const newLike = await Like.create({ tweet: tweetId, likedBy: req.user._id });
    return res.status(200).json(new ApiResponse(newLike, 200, "Tweet liked successfully"));
});

// const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO: get all liked videos
//     const likedVideos = await Like.find({ likedBy: req.user._id }).populate("video", "title thumbnail videoFile views duration owner").select("-_id");

//     if(likedVideos.length === 0){
//         return res.status(200).json(new ApiResponse(likedVideos=[], 200, "No liked videos found"));
//     }else{
//         return res.status(200).json(new ApiResponse(likedVideos, 200, "Liked videos found"));
//     }

// })
//optimised code
const getLikedVideos = asyncHandler(async (req, res) => {
    // Fetch all liked videos by the user, ensuring only valid video references are included
    const likedVideos = await Like.find({ likedBy: req.user._id, video: { $ne: null } })
        .populate("video", "title thumbnail videoFile views duration owner")
        .select("video"); // Select only the populated video field

    return res.status(200).json(new ApiResponse(likedVideos, 200, likedVideos.length ? "Liked videos found" : "No liked videos found"));
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}