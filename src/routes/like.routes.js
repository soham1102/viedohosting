import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
const router=Router()

router.route("/toggle-viedo-like").post(verifyJWT,toggleVideoLike)
router.route("/toggle-comment-like").post(verifyJWT,toggleCommentLike)
router.route("/toggle-tweet-like").post(verifyJWT,toggleTweetLike)
router.route("/get-liked-viedos").post(verifyJWT,getLikedVideos)

export default router