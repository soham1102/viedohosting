import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteViedo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/viedo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/get-viedos").get(getAllVideos)
router.route("/publish-viedos").post(verifyJWT,
upload.fields([
    { 
        name : "viedoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo)
router.route("/c/:viedoId").get(verifyJWT,getVideoById)
router.route("/:viedoId").patch(verifyJWT,
    upload.fields([
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),updateVideo)
router.route("/:viedoId").delete(verifyJWT,deleteViedo)
router.route("/:viedoId").patch(togglePublishStatus)
export default router