import { Router } from 'express';
import {
    addVideoToPlayList,
    createPlayList,
    deletePlayList,
    getPlayListById,
    getUserPlayLists,
    removeVideoFromPlayList,
    updatePlayList,
} from "../controllers/playlist.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlayList)

router
    .route("/:PlayListId")
    .get(getPlayListById)
    .patch(updatePlayList)
    .delete(deletePlayList);

router.route("/add/:videoId/:PlayListId").patch(addVideoToPlayList);
router.route("/remove/:videoId/:PlayListId").patch(removeVideoFromPlayList);

router.route("/user/:userId").get(getUserPlayLists);

export default router