// require('dotenv').config(({path:'.env'}))

import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv"
dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    const port=process.env.PORT || 8000;
    app.listen(port,()=>{
        console.log(`Server is running at port: ${port}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!!",err);
})









/*
import express from "express"
const app=express()

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{  // on ek listener hai
            console.log("Error our application is not able to talk with express",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on prot ${process.env.PORT}`)
        })
    }
    catch(error){
        console.log("Error: ",error)
        throw error
    }
})()*/