import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    // Check if video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found.");
    }

    // Fetch comments with pagination and sorting
    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username email fullname") // Populate user details
        .sort({ createdAt: -1 }) // Sort by latest first
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(); // Optimize performance

    const totalComments = await Comment.countDocuments({ video: videoId });

    res.status(200).json(new ApiResponse(
        {
            total: totalComments,
            page: Number(page),
            limit: Number(limit),
            comments,
        },
        200,
        "Comments fetched successfully"
    ));
});


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body;
    if(!content) {
        throw new ApiError(400, "Comment content is required.")
    }
    const comment = await Comment.create({content, owner: req.user._id, video: req.params.videoId});
    //populate the tweet
    const populatedComment = await Comment.findById(comment._id)
    .populate('owner', 'username fullname')
    .populate('video', 'title')
    .select('-__v')
    .lean();

    if(!populatedComment){
        throw new ApiError(500, "cannnot populate tweet")
    }

    res.status(201).json(new ApiResponse(populatedComment, 201, "Comment submitted successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params.commentId;
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID.")
    }
    const {content} = req.body;
    if(!content) {
        throw new ApiError(400, "Comment content is required.")
    }
    const comment = await Comment.findById(commentId);
    if(!comment) {
        throw new ApiError(404, "Comment not found.")
    }
    // if(comment.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "You can only edit your own comments.")
    // }

    comment.content = content;
    await comment.save();

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params.commentId;
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID.")
    }
    const comment = await Comment.findById(commentId);
    if(!comment) {
        throw new ApiError(404, "Comment not found.")
    }
    // if(comment.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "You can only delete your own comments.")
    // }
    await comment.remove();
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
