import mongoose,{Schema} from "mongoose";

const playListSchema=new Schema(
    {
        name:{
            type:String,
            required:true
        },
        viedos:[
            {
                type:Schema.Types.ObjectId,
                ref:"Viedo"
            }
        ],
        description:{
            type:String,
            required:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
    },{ timestamps:true }
)

export const PlayList=mongoose.model("PlayList",playListSchema)