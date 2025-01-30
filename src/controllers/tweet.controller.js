import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        throw new ApiError(400, "Tweet content is required.");
    }

    const tweet = await Tweet.create({ content, user: req.user._id });

    // Populate the user details
    const populatedTweet = await Tweet.findById(tweet._id)
        .populate("owner", "username email fullname")
        .select("-__v") // Exclude Mongoose version key
        .lean();

    res.status(201).json(new ApiResponse(populatedTweet, 201, "Tweet created successfully"));
});

// Get all tweets of a user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }

    const tweets = await Tweet.find({ user: userId })
        .populate("user", "username email fullname")
        .select("-__v") // Exclude Mongoose version key
        .lean();

    res.status(200).json(new ApiResponse(tweets, 200, "Tweets fetched successfully"));
});

// Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID.");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found.");
    }

    // Check if the user owns the tweet
    // if (tweet.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "You can only edit your own tweets.");
    // }

    // Update tweet content if provided
    tweet.content = content || tweet.content;
    await tweet.save();

    res.status(200).json(new ApiResponse(tweet, 200, "Tweet updated successfully"));
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID.");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found.");
    }

    // Check if the user owns the tweet
    // if (tweet.user.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "You can only delete your own tweets.");
    // }

    await tweet.deleteOne(); // More efficient than findByIdAndDelete

    res.status(200).json(new ApiResponse(null, 200, "Tweet deleted successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};
