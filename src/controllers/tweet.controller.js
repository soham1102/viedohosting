import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body
    try {
        if(!content || content.trim().length ===0){
            throw new ApiError(400,"write a tweet as it is empty")
        }
        // const createcontent=await Tweet.aggregate([
        //     {
        //         $match:{
        //             _id:req.user?._id
        //         }
        //     },
        //     {
        //         $lookup:{
        //             from:"user",
        //             localField:"owner",
        //             foreignField:"_id",
        //             as:"contentcreation"
        //         }
        //     }
        // ])
        const tweet=await Tweet.create(
            {
                content,
                owner:req.user?._id // i have user from verifyJWT
            }
        )
        const populateTweet=await tweet.populate("owner","username avatar")
        res
        .status(201)
        .json(new ApiResponse(201, populateTweet, "Tweet created successfully"))
    } catch (error) {
        throw new ApiError(500,`tweet is not creating something went wrong ${error.message}`);
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const user=await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"this user doesnot exist")
    }
    const tweet=await Tweet.find({owner:user._id})
    .select("content createdAt owner") // owner optinal bheja hai
    .populate("owner","username avatar")
    if(!tweet || tweet.length===0){
        throw new ApiError(404,"this user doesnot contain any tweet")
    }
    const tweetContents = tweet.map(t => t.content)
    console.log(tweetContents)
    // ["My first tweet!", "Learning backend!"]

    return res.status(200)
    .json(new ApiResponse(200,tweetContents,"Tweet is fectched successfully from user"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params
    const {newTweet}=req.body;
    if(!newTweet || newTweet.trim().length ===0){
        throw new ApiError(400,"please first provide updated tweet")
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"that tweet doesnot exist")
    }
    //check ownership compare tweet.owner with logged in user id
    // req.user is set in your verifyJWT middleware
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request you are not allowed to update the tweet")
    }
    const updatethings=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newTweet
            }
        },
        {
            new:true,
        }
    )
    if (!updatethings) {
        throw new ApiError(404, "Tweet not found");
    }
    return res.status(200)
    .json(new ApiResponse(200,updatethings,"Tweet is updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params;
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"That Tweet id doesnot exist")
    }
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request you are not allowed to update the tweet")
    }
    const deletetweet=await Tweet.findByIdAndDelete(tweetId)
    return res.status(200)
    .json(new ApiResponse(200,deletetweet,"tweet is deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}