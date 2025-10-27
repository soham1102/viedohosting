import mongoose, { isValidObjectId } from "mongoose"
import {Viedo} from "../models/viedo.models.js"
import {Subscription} from "../models/subscriptions.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { userInfo } from "os"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId}=req.params
    const {page,limit}=req.query
    const pageNum=parseInt(page) || 1;
    const limitNum=parseInt(limit) || 5;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }
    // hamare pass dashboard model nhi hai aur hamko iski need bi nhi hai hum aggregation pipeline use kregay
    const subscriberList=await Subscription.find({channel:channelId})
    .populate("subscriber","username fullName avatar")
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    const totalSubscribers=await Subscription.countDocuments({channel:channelId})
    
    // each channel id is reference with user as every channel is user 
    // and in viedo model we have owner of viedo that is reference with user
    // which user is owner of this 

    // channel owner and viedo owner must be same 
    const channelNum = await Subscription.findOne({channel:channelId})
    .populate("channel")

    if (!channelNum) {
        return res.status(404).json({ message: "Channel not found" });
    }
    const channelOwnerId=channelNum.channel.owner
    const viedosList=await Viedo.find({owner:channelOwnerId})
    .populate("owner","username fullName")
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    const totalViedos=await Viedo.countDocuments({owner:channelOwnerId})

    // get total likes
    // inefficient way 
    // const totalViedosLikes=viedosList.reduce((sum,value)=> sum+=value.like,0)

    // more good approach 
    const likes=await Viedo.aggregate([
        {
            $match:{owner:channelOwnerId}
        },
        {
            $group:{
                _id:null,
                totalLikes:{
                    $sum:"$like"
                }
            }
        }
    ])
    const totalViedosLike=likes[0]?.totalLikes || 0;

    const view=await Viedo.aggregate([
        {
            $match:{
                owner:channelOwnerId
            }
        },
        {
            $group:{
                _id:null,
                totalView:{
                    $sum:"$views"
                }
            }
        }
    ])
    const totalViedoViews=view[0]?.totalView || 0;

    return res.status(200)
    .json(new ApiResponse(200,{
        subscriberList,
        totalSubscribers,
        totalViedosLike,
        totalViedos,
        totalViedoViews
    }," Dashboard represent all the important things successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId}=req.params
    const {page,limit}=req.query
    const pageNum=parseInt(page) || 1
    const limitNum=parseInt(limit) || 5
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }
    const channelNum=await Subscription.findOne({channel:channelId})
    .populate("channel")
    if(!channelNum){
        throw new ApiError(404,"Channel doesnot found")
    }
    const channelOwner=channelNum.channel.owner
    const getAllViedos=await Viedo.find({owner:channelOwner})
    .populate("owner","-password -email")
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    return res.status(200)
    .json(new ApiResponse(200,{getAllViedos},"all viedos of channel are fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }