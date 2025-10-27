import mongoose, {isValidObjectId} from "mongoose"
import { Viedo } from "../models/viedo.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import path from "path"


const getAllVideos = asyncHandler(async (req, res) => {

    let { page, limit,sortBy } = req.query
    //TODO: get all videos based on query, sort, pagination
    try {
        page=parseInt(page) || 1;
        limit=parseInt(limit) || 5;
        const sortOrder=sortBy?.toLowerCase()==="asc"?1:-1;
        const viedos=await Viedo.find({})
        .populate("owner","-password -refreshToken")
        .sort({createdAt:sortOrder}) // because in MongoDB (and Mongoose), sorting requires a key–value object, not just a single value
        .skip((page-1)*limit)
        .limit(limit)
        //
        // if(!viedos){
        //     throw new ApiError(400,"No viedo found");
        // }
        const allTotalViedos=await Viedo.countDocuments();
        return res.status(200)
        .json
        (new ApiResponse(200,
            {
                viedos,
                totalPages: Math.ceil(allTotalViedos/limit),
                currentpages:page,
            },
            "Viedo fetched Successfully"))
    } catch (error) {
        console.log("Viedos are not Fethed some error occured",error)
        throw new ApiError(500, error.message)
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400,"title or description is missing");
    }
    try {
        const localUploadViedo=path.resolve(req.files?.viedoFile?.[0]?.path);
        const localThumbNail=path.resolve(req.files?.thumbnail?.[0]?.path);
        if(!localUploadViedo || !localThumbNail){
            throw new ApiError(400,"Viedo or file is missing");
        }
        const viedo=await uploadOnCloudinary(localUploadViedo);
        const thumbNail=await uploadOnCloudinary(localThumbNail);
        if(!viedo || !thumbNail){
            throw new ApiError(500,"File is not properly uploaded in Cloudinary")
        }
        const user=await User.findById(req.user?._id);
        const newViedo=await Viedo.create({
            viedoFile:viedo.secure_url,
            thumbnail:thumbNail.secure_url || "",// agar coudinary generate krega too daal dena
            title,
            description,
            duration:viedo.duration || 0,
            views:0,
            isPublished:true,
            owner:req.user._id,
            like:0
        })
        return res.status(200)
        .json(new ApiResponse(
            200,
            newViedo,
            "viedoFile is uploaded successfully"
        ))
    } catch (error) {
        throw new ApiError(404,error.message || "something went wrong while uploading viedo or thumbnail")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { viedoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(viedoId)){
        throw new ApiError(400,"that viedo doesnot exist")
    }
        const loggedInUSer=await User.findById(req.user?._id)
        const viedo=await Viedo.findById(viedoId).populate("owner","-password -email")
        if(!viedo){
            throw new ApiError(404,"Viedo is not present")
        }
        viedo.views+=1;
        await viedo.save()
        console.log("views on this viedo is",viedo.views)
        const isOwner=viedo.owner._id.toString()===loggedInUSer._id.toString()?true:false;
        if(!isOwner){
            loggedInUSer.watchHistory.push(viedo._id)
            await loggedInUSer.save();
            console.log("watchHistory of loggedInUSer",loggedInUSer.watchHistory);
        }
        return res.status(200)
        .json(
            new ApiResponse(200,{...viedo.toObject(),isOwner},
            "Viedo retrived successfully"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { viedoId} = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description}=req.body;
    if(!viedoId){
        throw new ApiError(400,"viedo is not present in system")
    }
    const localThumbnailpath=path.resolve(req.files?.thumbnail?.[0]?.path);
    if(!localThumbnailpath){
        throw new ApiError(500,"Thumbnail is not present in server")
    }
    const updatedthumbnail=await uploadOnCloudinary(localThumbnailpath)
    if(!updatedthumbnail){
        throw new ApiError(500,"Cloudinary failed to upload thumbnail")
    }
    const updatethings=await Viedo.findByIdAndUpdate(
        viedoId,
        {
            $set:{
                thumbnail:updatedthumbnail?.secure_url,
                title:title || null,
                description:description || null
            }
        },
        {
            new:true
        }
    ).select("-password")
    if(!updatethings){
        throw new ApiError(400,"updation process in viedo is failed")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,{updatethings},
        "all the viedos details are updated successfully")
    )
})

const deleteViedo = asyncHandler(async (req, res) => {
    const { viedoId } = req.params
    //TODO: delete video
    try {
        const viedo=await Viedo.findById(viedoId)
        // check that viedo document exist or not
        if(!viedo){
            throw new ApiError(400,"that viedo doesnot exist in mongodb");
        }
        //delete the viedo and thumbnail from cloudinary also
        // we can delete directly by using public_id but in our setup we donot put public id
        // so we need to extract that public id manullay from viedoId
        // if(viedo.thumbnail){
        //     const splitted=viedo.thumbnail.split('/');
        //     const publicWithDotPng=splitted[splitted.length - 1];
        //     const publicId=publicWithDotPng.split('.')[0];
        //     try{
        //         await cloudinary.uploader.destroy(publicId,{ resource_type: "image" })
        //     }
        //     catch(error){
        //         throw new ApiError(500,"Thumbnail File is not delete from Cloudinary")
        //     }
        // }
        // if(viedo.viedoFile){
        //     const splitted=viedo.viedoFile.split('/');
        //     const publicWithDotPng=splitted[splitted.length - 1];
        //     const publicId=publicWithDotPng.split('.')[0];
        //     try{
        //         await cloudinary.uploader.destroy(publicId,{ resource_type: "viedo" })
        //     }
        //     catch(error){
        //         throw new ApiError(500,"viedo File is not delete from Cloudinary")
        //     }
        // }
        // this delete the viedo from mongodb
        const deleteitem=await Viedo.findByIdAndDelete(viedoId)
        res.status(200)
        .json(new ApiResponse(200,{},"viedo file is deleted successfully"))
    } catch (error) {
        console.log("Delete viedo error",error)
        throw new ApiError(400,"Something went wrong while deleting the viedo file")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { viedoId } = req.params
    try{
    const viedo=await Viedo.findById(viedoId);
    // viedo.isPublished=true?false:true;
    if (!viedo) {
        throw new ApiError(404, "Viedo not found");
    }
    viedo.isPublished=!(viedo.isPublished);
    await viedo.save();
    return res.status(200)
    .json(new ApiResponse(200,
        {viedo},
        "toggle viedo is working successfully"
    ))
}catch(error){
    console.log("error in toggleviedo",error)
    throw new ApiError(400,"Something went wrong while toggling the viedo")
}
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteViedo,
    togglePublishStatus
}