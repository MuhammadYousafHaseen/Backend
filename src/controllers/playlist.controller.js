import mongoose, { isValidObjectId } from "mongoose";
import { PlayList } from "../models/PlayList.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

// const createPlayList = asyncHandler(async (req, res) => {
//     const {name, description} = req.body

//     //TODO: create PlayList
//     if(!name || !description) {
//         throw new ApiError(400, "Name and description are required")
//     }
//     const PlayList = await PlayList.create({
//         name,
//         description,
//         owner: req.user._id,

//     })
//     if(!PlayList) {
//         throw new ApiError(500, "Error creating PlayList")
//     }

//     res.status(201).json(new ApiResponse(PlayList, 201, "PlayList created successfully"))

// })
// optimised code
const createPlayList = asyncHandler(async (req, res) => {
  const { name, description, videos = [] } = req.body; // Accept videos in request (optional)

  // Validate input
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  // check if playlist already exists ...
    const existingPlaylist = await PlayList.findOne({ name, owner: req.user._id });
    if (existingPlaylist) {
      throw new ApiError(400, "Playlist already exists");
    }
  // Create a new PlayList
  const Playlist = await PlayList.create({
    name,
    description,
    owner: req.user._id,
    videos,
  });

  res.status(201).json(new ApiResponse(Playlist, 201, "PlayList created successfully"));
});

// const getUserPlayLists = asyncHandler(async (req, res) => {
//     const {userId} = req.params
//     //TODO: get user PlayLists
//     if(!userId || !isValidObjectId(userId)){
//         throw new ApiError(400, "Missing or Invalid user id")
//     }
//     const PlayLists = await PlayList.find({owner: userId})
//     if(!PlayLists) {
//         throw new ApiError(404, "No PlayLists found")
//     }
//     res.status(200).json(new ApiResponse(PlayLists, 200, "PlayLists retrieved successfully"))
// })
//optimise code
const getUserPlayLists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate userId
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Missing or invalid user ID");
  }

  // Fetch user PlayLists and populate videos
  const PlayLists = await PlayList.find({ owner: userId })
    .populate("videos", "title thumbnail duration owner")
    .select("-__v"); // Exclude unwanted fields

  if (!PlayLists.length) {
    return res.status(200).json(new ApiResponse([], 200, "No PlayLists found"));
  }

  res.status(200).json(new ApiResponse(PlayLists, 200, "PlayLists retrieved successfully"));
});

const getPlayListById = asyncHandler(async (req, res) => {
  const { PlayListId } = req.params;
  //TODO: get PlayList by id
  if (!PlayListId || !isValidObjectId(PlayListId)) {
    throw new ApiError(400, "Missing or Invalid PlayList id");
  }
  const Playlist = await PlayList.findById(PlayListId)
    .populate("videos", "title thumbnail duration owner")
    .select("-__v") // Exclude unwanted fields
    .lean();
  if (!PlayList) {
    throw new ApiError(404, "No PlayList found");
  }
  res.status(200).json(new ApiResponse(Playlist, 200, "PlayList retrieved successfully"));
});

const addVideoToPlayList = asyncHandler(async (req, res) => {
    const { PlayListId, videoId } = req.params; // Both IDs from params

    // Validate IDs
    if (!PlayListId || !isValidObjectId(PlayListId)) {
        throw new ApiError(400, "Invalid or missing PlayList ID");
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID");
    }

    // Check if PlayList exists
    const Playlist = await PlayList.findById(PlayListId);
    if (!Playlist) {
        throw new ApiError(404, "PlayList not found");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Add video if not already in the PlayList
    if (!Playlist.videos.includes(videoId)) {
        Playlist.videos.push(videoId);
        await Playlist.save();
    }

    // Fetch updated PlayList with populated videos and their owners
    const finalPlayList = await PlayList.findById(PlayListId)
        .populate({
            path: "videos",
            select: "title thumbnail duration owner",
            populate: {
                path: "owner",
                select: "fullname username avatar",
            },
        })
        .lean();

    res.status(200).json(new ApiResponse(finalPlayList, 200, "Video added to PlayList successfully"));
});


// const removeVideoFromPlayList = asyncHandler(async (req, res) => {

//   const { PlayListId, videoId } = req.params;
//   // TODO: remove video from PlayList
//     // Validate IDs
//     if (!PlayListId || !isValidObjectId(PlayListId)) {
//         throw new ApiError(400, "Invalid or missing PlayList ID");
//     }
//     if (!videoId || !isValidObjectId(videoId)) {
//         throw new ApiError(400, "Invalid or missing video ID");
//     }

//     // Check if PlayList exists
//     const PlayList = await PlayList.findById(PlayListId);
//     if (!PlayList) {
//         throw new ApiError(404, "PlayList not found");
//     }

//     // Check if video exists
//     const video = await Video.findById(videoId);
//     if (!video) {
//         throw new ApiError(404, "Video not found");
//     }


//     // Remove video if it exists in the PlayList
//     if (PlayList.videos.includes(videoId)) {
//         PlayList.videos = PlayList.videos.filter((id) => id.toString() !== videoId);
//         await PlayList.save();
//     }

//     // Fetch updated PlayList with populated videos and their owners
//     const finalPlayList = await PlayList.findById(PlayListId)
//         .populate({
//             path: "videos",
//             select: "title thumbnail duration owner",
//             populate: {
//                 path: "owner",
//                 select: "fullname username avatar",
//             },
//         })
//         .lean();

//     res.status(200).json(new ApiResponse(finalPlayList, 200, "Video removed from PlayList successfully"));

// });
//optimised code
const removeVideoFromPlayList = asyncHandler(async (req, res) => {
    const { PlayListId, videoId } = req.params;

    // Validate IDs
    if (!PlayListId || !isValidObjectId(PlayListId)) {
        throw new ApiError(400, "Invalid or missing PlayList ID");
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID");
    }

    // Check if PlayList exists
    const Playlist = await PlayList.findById(PlayListId);
    if (!Playlist) {
        throw new ApiError(404, "PlayList not found");
    }

    // Remove video if it exists in the PlayList
    const initialLength = Playlist.videos.length;
    Playlist.videos = Playlist.videos.filter((id) => id.toString() !== videoId);

    if (Playlist.videos.length < initialLength) {
        await Playlist.save();
    }

    // Fetch updated PlayList with populated videos
    const updatedPlayList = await PlayList.findById(PlayListId)
        .populate("videos", "title thumbnail duration owner")
        .lean();

    res.status(200).json(new ApiResponse(updatedPlayList, 200, "Video removed from PlayList successfully"));
});

// const deletePlayList = asyncHandler(async (req, res) => {
//   const { PlayListId } = req.params;
//   // TODO: delete PlayList
//   if(!PlayListId || !isValidObjectId(PlayListId)) {
//     throw new ApiError(400, "Invalid or missing PlayList ID");
//   }
//     const PlayList = await PlayList.findByIdAndDelete(PlayListId);
//     if(!PlayList) {
//         throw new ApiError(404, "PlayList not found");
//     }
//     res.status(200).json(new ApiResponse(null, 200, "PlayList deleted successfully"));
// });
//optimised code
const deletePlayList = asyncHandler(async (req, res) => {
    const { PlayListId } = req.params;

    // Validate PlayList ID
    if (!PlayListId || !isValidObjectId(PlayListId)) {
        throw new ApiError(400, "Invalid or missing PlayList ID");
    }

    // Find and delete the PlayList
    const Playlist = await PlayList.findOneAndDelete({ _id: PlayListId });
    if (!Playlist) {
        throw new ApiError(404, "PlayList not found");
    }

    res.status(200).json(new ApiResponse({ success: true }, 200, "PlayList deleted successfully"));
});


// const updatePlayList = asyncHandler(async (req, res) => {
//   const { PlayListId } = req.params;
//   const { name, description } = req.body;
//   //TODO: update PlayList

//   if (!PlayListId || !isValidObjectId(PlayListId)) {
//     throw new ApiError(400, "Invalid or missing PlayList ID");
//   }
//   if(!name || !description) {
//     throw new ApiError(400, "Invalid or missing PlayList name or description");
//   }
//   const PlayList = await PlayList.findByIdAndUpdate(PlayListId, {name, description}, {new: true});
//   if(!PlayList) {
//     throw new ApiError(404, "PlayList not found");
//   }
//   res.status(200).json(new ApiResponse(PlayList, 200, "PlayList updated successfully"));
// });
//optimised code
const updatePlayList = asyncHandler(async (req, res) => {
    const { PlayListId } = req.params;
    const { name, description } = req.body;

    // Validate PlayList ID
    if (!PlayListId || !isValidObjectId(PlayListId)) {
        throw new ApiError(400, "Invalid or missing PlayList ID");
    }

    // Ensure at least one field is being updated
    if (!name && !description) {
        throw new ApiError(400, "At least one field (name or description) must be provided for update");
    }

    // Construct update object dynamically
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description) updateFields.description = description.trim();

    // Find and update PlayList
    const Playlist = await PlayList.findByIdAndUpdate(PlayListId, updateFields, { 
        new: true, 
        runValidators: true 
    });

    if (!Playlist) {
        throw new ApiError(404, "PlayList not found");
    }

    res.status(200).json(new ApiResponse(Playlist, 200, "PlayList updated successfully"));
});


export {
  createPlayList,
  getUserPlayLists,
  getPlayListById,
  addVideoToPlayList,
  removeVideoFromPlayList,
  deletePlayList,
  updatePlayList,
};
