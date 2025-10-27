import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken=async(userid)=>{
    try{
        // console.log("UserID received for token generation:", userid);
        const user=await User.findById(userid);
        // console.log(user)
        const accessToken=user.generateAccessToken()
        // console.log(accessToken)
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken}

    }
    catch(err){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    // take all the (user details) data from the frontend
    // validation  - not empty
    // check user already present or not: useranem email
    // check for images check for avatar aur cover image lene hai
    // avatar aur cover image ko cloudinary prr bi dalle gay
    // check avatar uploaded on cloudinary or not
    // create user object -- create entry in db
    // remove password and refresh token from response
    // check for user creation 
    // return res

    const {fullName,email,username,password}= req.body
    console.log("email",email);
    
    if(
        [fullName,email,username,password].some((field) =>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser= await User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }
    console.log(req.files);
    const avatarlocalpath=path.resolve(req.files?.avatar[0]?.path);
    // const avatarlocalpath=req.files?.avatar?.[0] ? path.resolve(req.files.avatar[0].path) : null;
    // const coverImagelocalpath=req.files?.coverImage?.[0].path;
    if(!avatarlocalpath){
        throw new ApiError(400,"Avatar file is required")
    }
    let coverImagelocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImagelocalpath=req.files.coverImage[0].path;
    }

    const avatar=await uploadOnCloudinary(avatarlocalpath)
    const coverImage=await uploadOnCloudinary(coverImagelocalpath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered Successfully")
    )
})
const loginUser=asyncHandler(async (req,res)=>{
    // req.body=>data
    // login with username or email
    // find the user
    // password check
    // generate access token and refresh token
    // send cookie

    const {email,username,password}=req.body;
    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const{accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)

    // send them in cookie
    const loggedInUser=await User.findById(user._id).
    select("-password -refreshToken")

    const options={
        httpOnly:true, // we do httpOnly true cookie can be seen but only modificabe through server
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
        )
    )
})
const logoutUser=asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set:{
            //     refreshToken:undefined
            // }
            $unset:{
                refreshToken:1 // this removes the field from document
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    // aab hamara incoming token decoded token mei change ho gya hai
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
        res.
        status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

const changecurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    // const {oldPassword,newPassword,confPassword}=req.body;
    // if(!(newPassword===confPassword)){
    //     throw new ApiError
    // }
    // agar yeh password change krwa rha hai mtlb yeh login too hai hee
    // jab login hoga too isme access hoga na user ka 
    const user=await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json
    (new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!(fullName || email)){
        throw new ApiError(400,"All fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Cloudinary doesnot produce a url for this file or error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url  // isme avatar.url isliye liye hai kyuki hum viedo model mei string lay rhe hai 
                // aur avatar ek object hai hamko sirf aada hee chaiye hai 
            }
        },
        {
            new:true
        }.select("-password")
    )
    return res.status(200)
    .json(
        new ApiResponse(200,user,"Avatar is updated successfully")
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Cloudinary doesnot produce a url for this file or error while uploading on coverImage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url  // isme avatar.url isliye liye hai kyuki hum viedo model mei string lay rhe hai 
                // aur avatar ek object hai hamko sirf aada hee chaiye hai 
            }
        },
        {
            new:true
        }.select("-password")
    )
    return res.status(200)
    .json(
        new ApiResponse(200,user,"Cover image is updated successfully")
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    const channel=await User.aggregate([
        {
        // Left-hand side → username inside $match
        // This username is the field in the database (User collection).
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers" // hamare channel ko kisne subscribe kiya hai

            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedto"  // yeh hammne jisko subscribe kiya hai 
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedto"
                },
                isSubscribed:{
                        $cond:{
                            // { $in: [ <value>, <array> ] }
                            // Returns true if <value> exists in <array>, otherwise false.
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subsribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    // hum trim aur length se optinal chaining isliye krte hai takki null or undefined wale bi handle ho jaye
    // username mei ttrim use kiya tha kyuki woh ek string hai
    // aur joo hamko channel milte hai yeh hamko array milta hai uske liye hammne length use kiya hai
    // isko hum string kay sath bi use krr skte hai
    if(!channel?.length){
        throw new ApiError(404,"channel doesnot exist")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"viedos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1,
                                }
                            }
                        ]
                    }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner" // it is used to convert array into object
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changecurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory



}
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { User } from "../models/user.models.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import path from "path";
// import fs from "fs/promises";
// import { constants as fsConstants } from "fs";

// const registerUser = asyncHandler(async (req, res) => {
//   const { fullName, email, username, password } = req.body;
//   console.log("email", email);

//   // 1. Basic validation
//   if ([fullName, email, username, password].some(field => field?.trim() === "")) {
//     throw new ApiError(400, "All fields are required");
//   }

//   // 2. Check for existing user
//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }]
//   });
//   if (existedUser) {
//     throw new ApiError(409, "User with email or username already exists");
//   }

//   console.log("req.files:", req.files);

//   // 3. Avatar must be present
//   if (!req.files?.avatar || !Array.isArray(req.files.avatar) || req.files.avatar.length === 0) {
//     throw new ApiError(400, "Avatar file is required");
//   }

//   // 4. Normalize & resolve avatar path
//   const rawAvatarPath = req.files.avatar[0].path;
//   console.log("rawAvatarPath",rawAvatarPath)
//   // optional: also use originalname if needed, but path should be enough
//   if (!rawAvatarPath) {
//     throw new ApiError(400, "Avatar file path missing");
//   }

//   // Normalize path e.g. turn backslashes into OS correct separators
//   const normalizedAvatarPath = path.normalize(rawAvatarPath);
//   // Resolve to absolute path
//   const absoluteAvatarPath = path.isAbsolute(normalizedAvatarPath)
//     ? normalizedAvatarPath
//     : path.resolve(normalizedAvatarPath);

//   console.log("normalizedAvatarPath:", normalizedAvatarPath);
//   console.log("absoluteAvatarPath:", absoluteAvatarPath);

//   // 5. Check file exists & readable
//   try {
//     await fs.access(absoluteAvatarPath, fsConstants.R_OK);
//   } catch (err) {
//     console.error("Avatar file not found or not readable:", absoluteAvatarPath, err);
//     throw new ApiError(400, "Avatar file not found or not readable");
//   }

//   // 6. (Optional) Same logic for cover image if provided
//   let coverLocalPath = null;
//   if (req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//     const rawCoverPath = req.files.coverImage[0].path;
//     if (rawCoverPath) {
//       const normalizedCover = path.normalize(rawCoverPath);
//       coverLocalPath = path.isAbsolute(normalizedCover) ? normalizedCover : path.resolve(normalizedCover);

//       // check if accessible
//       try {
//         await fs.access(coverLocalPath, fsConstants.R_OK);
//       } catch (err) {
//         console.warn("Cover image file not readable. Ignoring coverImage. Path:", coverLocalPath, err);
//         coverLocalPath = null; // treat as if no cover image
//       }
//     }
//   }

//   // 7. Upload to Cloudinary
//   let avatarUploadResult;
//   try {
//     avatarUploadResult = await uploadOnCloudinary(absoluteAvatarPath);
//   } catch (err) {
//     console.error("Error uploading avatar to Cloudinary:", err);
//     throw new ApiError(500, "Failed to upload avatar");
//   }
//   console.log("Cloudinary avatarUploadResult:", avatarUploadResult)

//   let coverUploadResult = null;
//   if (coverLocalPath) {
//     try {
//       coverUploadResult = await uploadOnCloudinary(coverLocalPath);
//     } catch (err) {
//       console.warn("Error uploading coverImage to Cloudinary:", err);
//       // decide whether to fail or just skip cover image
//       // for now let's skip and proceed
//     }
//   }

//   if (!avatarUploadResult || !avatarUploadResult.url) {
//     throw new ApiError(500, "Avatar upload did not return a valid URL");
//   }

//   // 8. Create user
//   const user = await User.create({
//     fullName,
//     avatar: avatarUploadResult.url,
//     coverImage: coverUploadResult?.url || "", 
//     email,
//     password,  // note: still store hashed password ideally ‒ see below
//     username: username.toLowerCase()
//   });

//   // 9. Remove sensitive fields in response
//   const createdUser = await User.findById(user._id).select("-password -refreshToken");

//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while registering the user");
//   }

//   return res.status(201).json(
//     new ApiResponse(201, createdUser, "User registered Successfully")
//   );
// });

// export { registerUser };

