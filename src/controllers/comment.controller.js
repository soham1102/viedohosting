import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import { Viedo } from "../models/viedo.models.js"
import { User } from "../models/user.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const {page,limit}=req.query
    const {viedoId}=req.params
    if(!isValidObjectId(viedoId)){
        throw new ApiError(400,"invalid viedoId plzz provide the valid object id")
    }
    const pageNum=parseInt(page) || 1;
    const limitNum=parseInt(limit) || 10;
    const userId=req.user?._id ? new mongoose.Types.ObjectId(`${req.user._id}`):null;
    const comment=await Comment.aggregate([
        {
            $match:{
                viedo:new mongoose.Types.ObjectId(`${viedoId}`)
            }
        },
        {$sort:{createdAt:-1}},
        {$skip:((pageNum-1)*limitNum)},
        {$limit:limitNum},
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        password:0,
                        email:0
                    }
                }]
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likedField"
            },
           
        },
        {
            $addFields:{
                totalLikes:{$size:"$likedField"},
                isOwner:userId ? {$eq:["$owner._id",userId]}:false,
                isLiked:userId ? {$in:[userId,"$likedField.likedBy"]}:false
            }
        },
        {
            $project:{
                likedField:0
            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,comment,"comment and like information owner of comment is successfully fetched from viedoId"))
})

// this only return comments not provide how many likes are in comment who is owner and many more things
// const getVideoComments = asyncHandler(async (req, res) => {
//     //TODO: get all comments for a video
//     const {viedoId} = req.params
//     const {page = 1, limit = 10} = req.query
//     if(!viedoId){
//         throw new ApiError(400,"that viedo doesnot exist")
//     }
//     const pageNum=parseInt(page)
//     const limitNum=parseInt(limit)
//     const getComment=await Comment.find({viedo:viedoId})
//     .populate("owner","username avatar")
//     .skip((pageNum-1)*limitNum)
//     .limit(limitNum)
//     .sort({createdAt:-1})

//     const totalComments=await Comment.countDocuments({viedo:viedoId})

//     return res.status(200)
//     .json(new ApiResponse(200,{getComment,totalComments},"comment is fetched successfully"));
// });


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {comment}=req.body
    const {viedoId}=req.params
    if(!comment || comment.trim()===0){
        throw new ApiError(400,"comment field is empty or undefined")
    }
    if(!isValidObjectId(viedoId)){
        throw new ApiError(400,"that viedo doesnot exist")
    }
    // verifyJwt user come from there as i need to know which user added a comment
    const user=req.user?._id;
    // insted of checking user i think we need to find the id of viedo in which comment is posted 
    const viedo=await Viedo.findById(viedoId)
    if (!viedo) {
        throw new ApiError(404, "That video does not exist");
    }
    const addcomment = await Comment.create({
        content:comment,
        viedo:viedoId,
        owner:user
    })
    // Comment.populate is also fine but use below one
    const populateComment=await addcomment.populate("owner","username avatar")
    return res.status(200)
    .json(new ApiResponse(200,populateComment,"Comment is added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {newcomment}=req.body
    const {commentId}=req.params
    if(!newcomment || newcomment.trim().length ===0){
        throw new ApiError(400,"first provide the updated comment")
    }
    const updatecomment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:newcomment
            }
        },
        {
            new:true
        }
    )
    if(!updatecomment){
        throw new ApiError(404,"comment is not found")
    }
    return res.status(200)
    .json(new ApiResponse(200,updatecomment,"comment is updated successfullly"));
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    if(!commentId){
        throw new ApiError(400,"first pass the comment id which you want to delete")
    }
    const deletecomment=await Comment.findByIdAndDelete(commentId)
     // If not found
    if (!deletecomment) {
        throw new ApiError(404, "Comment not found or already deleted");
    }

    // ✅ Success response
    return res
        .status(200)
        .json(new ApiResponse(200, deletecomment, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }

// how to convert id into objectid
// const mongoose = require('mongoose');

// // Suppose you have an ID string:
// const idString = "6706f1bb5c43f07c31dfd9aa";

// // Convert it to ObjectId
// const objectId = new mongoose.Types.ObjectId(idString);

// console.log(objectId);  // 👉 ObjectId("6706f1bb5c43f07c31dfd9aa")
