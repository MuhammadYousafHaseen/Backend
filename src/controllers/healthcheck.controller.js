import mongoose from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

        // health status object
        const healthStatus = {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date(),
            database: dbState === 1 ? 'connected' : 'disconnected',
          };

         if (dbState !== 1) {
            return res.status(500).json({ ...healthStatus, status: 'error' });
         }

         return res.status(201).json(
            new ApiResponse(200, healthStatus, "Ok bro! Health is Ok dear!")
        )

    } catch (error) {
        throw new ApiError( 500, "Health check failed " )
    }
});
export {
    healthcheck
    }
    