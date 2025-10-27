import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

// this middleware only verifies it user exists or not
export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select
        ("-password -refreshToken")
        if(!user){
            // TODO: discuss about frontend
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})





// const verifyjwt=asyncHandler( async(req,res,next)=>{
//     const token=req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer"," ");
//     if(!token){
//         return new ApiError(401,"Access token is not present")
//     }
//     const decoded=jwt.sign(token,ACCESS_TOKEN_SECRERT)
//     const user=await User.findById(decoded?._id).select("-password -refreshToken")
//     req.user=user
//     next()
     

//     })
