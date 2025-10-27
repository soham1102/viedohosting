// yeh promises mei kaise ho ga
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>{next(err)})
    }
}

export { asyncHandler }
// steps to write higher order function function kay andr function ko return krna
// const asyncHandler=()=>{}
// const asyncHandler=(func)=>{()=>{}}
// const asyncHandler=(func)=>()=>{}

// agar try catch mei hoga too aise kregay hum 
// const asyncHandler=(fn)=>async (err,req,res,next)=>{
//     try{
//         await fn(err,req,res,next)
//     }
//     catch(error){
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }

// const asyncHandler=(requestHandler)=>
//     return (req,res,next)=>{
//         Promise.resolve(requestHandler(req,res,next)).catch((err)=>{next(err)})
//     }