import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/get-comments").get(verifyJWT,getVideoComments)
router.route("/add-comment").post(verifyJWT,addComment)
router.route("/update-comment").patch(verifyJWT,updateComment)
router.route("/delete-comment").delete(verifyJWT,deleteComment)

export default router