import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// const toggleSubscription = asyncHandler(async (req, res) => {
//     const {channelId} = req.params
//     // TODO: toggle subscription
//     if(!channelId){
//         throw new ApiError("Channel id is required", 400)
//     }
//     if(!isValidObjectId(channelId)){
//         throw new ApiError("Invalid channel id", 400)
//     }
//     const channel = await User.findById(channelId);
//     if(!channel){
//         throw new ApiError("Channel not found", 404)
//     }
//     // TODO: check if user is already subscribed to the channel
//     // TODO: if yes, unsubscribe
//     // TODO: if no, subscribe
//     const subscriberId = req.user._id;
//     const subscription = await Subscription.findOne({subscriber: subscriberId, channel: channelId});
//     if(subscription){
//         await Subscription.findByIdAndDelete(subscription._id);
//     }else{
//         await Subscription.create({subscriber: subscriberId, channel: channelId});
//     }
// })
//optimised controller ...
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError( 400,"Invalid or missing channel ID");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError("Channel not found", 404);
    }

    const subscriberId = req.user._id;
    const existingSubscription = await Subscription.findOneAndDelete({ subscriber: subscriberId, channel: channelId });

    if (existingSubscription) {
        return res.status(200).json(new ApiResponse(null, 200, "Unsubscribed successfully"));
    }

    const newSubscription = await Subscription.create({ subscriber: subscriberId, channel: channelId });
    res.status(201).json(new ApiResponse(newSubscription, 201, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//     const {channelId} = req.params;
//     if (!channelId || !isValidObjectId(channelId)) {
//         throw new ApiError("Invalid or missing channel ID", 400);
//     }

//     const channel = await User.findById(channelId);
//     if (!channel) {
//         throw new ApiError("Channel not found", 404);
//     }
//     // get channel subscribers using populate or aggregate method
//     const subscribers = await Subscription.aggregate([
//         { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "subscriber",
//                 foreignField: "_id",
//                 as: "subscribers",
//             },
//         },
//         { $unwind: "$subscribers" },
//         {
//             $project: {
//                 _id: 0,
//                 username: "$subscribers.username",
//                 email: "$subscribers.email",
//                 fullname: "$subscribers.fullname",
//             },
//         },
//     ]);
//     if (subscribers.length === 0) {
//         throw new ApiError("No subscribers found", 404);
//     }
//     res.status(200).json(
//         {
//             success: true,
//             message: "Subscribers fetched successfully",
//             data: subscribers
//         });
// })
//optimised a little bit
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError( 400,"Invalid or missing channel ID");
    }

    const subscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
            },
        },
        { $unwind: "$subscriber" },
        {
            $project: {
                _id: 0,
                username: "$subscriber.username",
                email: "$subscriber.email",
                fullname: "$subscriber.fullname",

            },
        },
    ]);

    res.status(200).json({
        success: true,
        message: "Subscribers fetched successfully",
        data: subscribers,
        total: subscribers.length
    });
});


// controller to return channel list to which user has subscribed
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//     const { subscriberId } = req.params
//     if (!subscriberId || !isValidObjectId(subscriberId)) {
//         throw new ApiError("Invalid or missing channel ID", 400);
//     }
//     const subscribers = await Subscription.find({ subscriber: subscriberId })
//     .populate("subscriber", "username email fullname")
//     .select("-_id subscriber");
     
//     if (subscribers.length === 0) {
//         throw new ApiError("No subscribers found", 404);
//     }
//     res.status(200).json(
//         {
//             success: true,
//             message: "Subscribers fetched successfully",
//             data: subscribers,
//             total: subscribers.length
//         });
// })

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriberId
    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError( 400,"Invalid or missing subscriber ID");
    }

    // Find all channels the subscriber is following
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email fullname") // Populate channel details
        .select("-_id channel");

    // Handle case when there are no subscriptions
    if (subscribedChannels.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No subscribed channels found",
            data: [],
            total: 0
        });
    }

    // Return response
    res.status(200).json({
        success: true,
        message: "Subscribed channels fetched successfully",
        data: subscribedChannels,
        total: subscribedChannels.length
    });
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}