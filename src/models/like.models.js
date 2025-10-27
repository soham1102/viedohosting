import mongoose,{Schema} from "mongoose";

const likeSchema=new Schema(
    {
        comment:{
            type:Schema.Types.ObjectId,
            ref:"Comment"
        },
        viedo:{
            type:Schema.Types.ObjectId,
            ref:"Viedo"
        },
        likedBy:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        tweet:{
            type:Schema.Types.ObjectId,
            ref:"Tweet"
        },
    },{ timestamps:true }
)

export const Like=mongoose.model("Like",likeSchema)