import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()
router.route("/get-channel-stats").get(verifyJWT,getChannelStats)
router.route("/get-channel-details").get(verifyJWT,getChannelVideos)

export default router