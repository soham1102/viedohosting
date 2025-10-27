import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import { Viedo } from "../models/viedo.models.js"
import { Tweet } from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {viedoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(viedoId)){
        throw new ApiError(400,"that viedo doesnot exist")
    }
    const userId=req.user?._id;
    const viedo=await Viedo.findById(viedoId)
    if (!viedo) {
        throw new ApiError(404, "Video not found");
    }
    // check kruga yeh viedo khi phle se too like nhi tha na agr hoga too uska like ko hthana pdega na
    const existingLike=await Like.findOne({
        viedo:viedoId,
        likedBy:req.user._id
    })
    // if existinglike tru then decrese one like from viedo and also remove the usename from liked section
    if(existingLike){
        const like=await Like.findByIdAndDelete(existingLike._id)
        viedo.like=viedo.like-1;
        await viedo.save()

        return res.status(200)
        .json(new ApiResponse(200,{...viedo},"viedo is marked to unlike"))
    }
    else{
        viedo.like+=1
        const like=await Like.create({
            viedo:viedoId,
            likedBy:req.user._id
        })
        await viedo.save()

        return res.status(200)
        .json(new ApiResponse(200,{...viedo,like},"viedo is marked to like"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"enter the correct commentId")
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"comment // content is not present")
    }
    const existingLike=await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        comment.like-=1
        await comment.save()
        return res.status(200)
        .json(new ApiResponse(200,{comment},"comment is marked as unliked"))
    }
    else{
        const like=await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })
        comment.like+=1
        await comment.save()
        return res.status(200)
        .json(new ApiResponse(200,{comment,like},"comment is marked to liked"))
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweetId is invalid")
    }
    const tweet=await Tweet.findById(tweetId)
     if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const existingLike=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(existingLike){
        const likes=await Like.findByIdAndDelete(existingLike._id)
        await Tweet.findByIdAndUpdate(tweetId,{
            $inc:{
                like:-1
            }
        },
            {
                new:true
            }
        )
        return res.status(200)
        .json(new ApiResponse(200,likes,"tweet like is marked to unliked"))
    }
    const like =await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    })
    tweet.like+=1
    await tweet.save()
    return res.status(200)
    .json(new ApiResponse(200,like,"tweet like button is marked to liked"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // first get the user whom liked viedo we want to return
    const {page,limit}=req.query
    const userId=req.user._id
    if(!userId){
        throw new ApiError(400,"Invalid user")
    }
    // so we need to do pagination in this
    const pageNum=parseInt(page) || 0;
    const limitNum=parseInt(limit) || 5;
    // it fetch all the things that are liked by that user
    // sort this so that i get recently like viedo on top
    const likes=await Like.find({likedBy:userId}).sort({createdAt:-1})
    // now extract viedo id from this likes as it contain many things
    const viedoId=likes.map((like)=> like.viedo)
    // my viedoId contains array as it contains lot of viedos
    // now i need to extract ids of liked viedo that are present in viedoId
    const extractedLikedViedos=await Viedo.find({
        _id:{
            $in:viedoId
        }
    })
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    return res.status(200)
    .json(new ApiResponse(200,extractedLikedViedos,"Liked viedos are fetched successfully"))
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}