import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/create-tweet").post(verifyJWT,createTweet)
router.route("/getuser-tweets/:userId").get(verifyJWT,getUserTweets)
router.route("/update-tweet/:tweetId").post(verifyJWT,updateTweet)
router.route("/delete-tweet/:tweetId").post(verifyJWT,deleteTweet)
export default router