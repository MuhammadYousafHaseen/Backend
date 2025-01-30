import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { upladOnCloudinary } from "../utils/cloudinary.js"
import { deleteVideoFromCloudinaryByUrl } from "../utils/deletevideoCloudinary.js"
import { deleteImageFromCloudinary } from "../utils/deleteCloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

    const filter = query
        ? { title: { $regex: query, $options: "i" } }
        : {};

    const sort = sortBy && sortType ? { [sortBy]: sortType === "asc" ? 1 : -1 } : {};

    const videos = await Video.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "users", // MongoDB collection name (lowercase)
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" }, // Convert array to object
        { $sort: sort },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
        {
            $project: {
                title: 1,
                videoUrl: 1,
                thumbnailUrl: 1,
                createdAt: 1,
                "ownerDetails.username": 1,
                "ownerDetails.email": 1
            }
        }
    ]);

    res.status(200).json({
        total: videos.length,
        page,
        limit,
        videos
    });
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }
    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    if(!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const video = await upladOnCloudinary(videoLocalPath);
    const thumbnail = await upladOnCloudinary(thumbnailLocalPath);
    const ownerId = req.user.id;

    if(!video || !thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading video to cloudinary")
    }


    const newVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: ownerId,
        duration: video.duration,
        
    })
    if(!newVideo) {
        throw new ApiError(500, "Something went wrong while creating video")
    }
    // Populate the owner details after saving
    const populatedVideo = await Video.findById(newVideo._id).populate("owner", "username fullname email");

    res.status(201).json(populatedVideo);
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } }, // Find specific video
        {
          $lookup: {
            from: "users", // Collection name of the referenced model (MongoDB lowercase)
            localField: "owner", // Field in the Video model
            foreignField: "_id", // Field in the User model
            as: "owner", // Name of the new field
          },
        },
        { $unwind: "$owner" }, // Convert array to an object
        {
          $project: {
            title: 1,
            videoUrl: 1,
            thumbnailUrl: 1,
            createdAt: 1,
            "owner.username": 1, // Show only specific fields
            "owner.email": 1,
            "owner.fullname": 1,
          },
        },
      ]);

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    res.status(200).json(new ApiResponse(200, "Video fetched successfully", video));

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const { title, description} = req.body;
    if(!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const {thumbnail, videoFile} = req.files;
    if(!thumbnail || !videoFile) {
        throw new ApiError(400, "Thumbnail and video file are required")
    }
    const videoLocalPath = videoFile[0].path;
    const thumbnailLocalPath = thumbnail[0].path;
    const updatevideo = await  upladOnCloudinary(videoLocalPath);
    const updatedthumbnail = await  upladOnCloudinary(thumbnailLocalPath);
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set:{
            title,
            description,
            thumbnail: updatedthumbnail.url,
            videoFile: updatevideo.url
        },
        
    },
    {new: true});

    if(!updatedVideo) {
        throw new ApiError(500, "Something went wrong while updating video")
    }

    
    await  deleteVideoFromCloudinaryByUrl(videoFile[0].path);
    await  deleteImageFromCloudinary(thumbnail[0].path);
    res.status(200).json(new ApiResponse(200, "Video updated successfully", updatedVideo));

    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findByIdAndDelete(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    
    await deleteVideoFromCloudinaryByUrl(video.videoFile);
    await deleteImageFromCloudinary(video.thumbnail);

    res.status(200).json(new ApiResponse(200, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle publish status of video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
       $set:{
            isPublished: !video.isPublished
       } 
    }, {new: true});
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    res.status(200).json(new ApiResponse(200, "Video publish status updated successfully", video));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
