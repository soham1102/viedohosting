import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema=new Schema(
    {
        content:{
            type:String,
            required:true
        },
        viedo:{
            type:Schema.Types.ObjectId,
            ref:"Viedo"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        like:{
            type:Number,
            default:0
        }
    },
    {
        timestamps:true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentSchema)