import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscriptions.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }
    const userId=req.user._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid channelId")
    }
    const existingSubscriber=await Subscription.findOne({
        channel:channelId,
        subscriber:userId
    })
    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id)
        
    }
    else{
        const channel=await Subscription.create({
            channel:channelId,
            subscriber:userId
        })
    }
    const subscriberCount=await Subscription.countDocuments({channel:channelId});
    return res.status(200)
        .json(new ApiResponse(200,{subscriberCount,isSubscribed:!existingSubscriber},"subscriber button  is toggled successfully "))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const {page,limit}=req.query
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }
    const pageNum=parseInt(page) || 0;
    const limitNum=parseInt(limit) || 5;
    const subscribersList=await Subscription.find({channel:channelId})
    .populate("subscriber","username fullName,avatar")
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    if(!subscribersList.length){
        throw new ApiError(404,"No subscriber is subscribed to channel")
    }
    const subscriberCount=await Subscription.countDocuments({channel:channelId})
    return res.status(200).
    json(new ApiResponse(200,{subscribersList},"All the users or subscriber of channel are extracted successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const {page,limit}=req.query
    const pageNum=parseInt(page) || 0;
    const limitNum=parseInt(limit) || 5;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriberId")
    }
    const channelList=await Subscription.find({subscriber:subscriberId})
    .populate("channel","fullName avatar")
    .skip((pageNum-1)*limitNum)
    .limit(limitNum)

    if(channelList.length ===0){
        console.log(`zero channel is subscribed by user ${subscriberId}`)
    }
    const channelCount=await Subscription.countDocuments({subscriber:subscriberId})

    return res.status(200)
    .json(new ApiResponse(200,channelList,"successfully extracted list of channel which user subscribed"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}