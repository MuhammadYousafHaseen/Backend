import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", ""); // check if token is in cookies or in headers
    
        if(!token){
            throw new ApiError(401, "Unauthorized Request, Please Login First");
        }
        
        const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken") // get user from database and remove password and refresh token from the response
        if(!user){
            throw new ApiError(401, "Unauthorized Request, Please Login First");
        }
        req.user = user; // attach user to request
        next();
    } catch (error) {
        if(error.name === "TokenExpiredError"){
            throw new ApiError(401, error.message || "Session Expired, Please Login Again");
        }
        throw new ApiError(401, error.message || "Unauthorized Request, Please Login First");
        
    }
});