import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/create-tweet").post(createTweet)
router.route("/getuser-tweets").post(verifyJWT,getUserTweets)
router.route("update-tweet").post(verifyJWT,updateTweet)
router.route("delete-tweet").post(verifyJWT,deleteTweet)
export default router