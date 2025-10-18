import { Router } from "express";
import CommonController from "../../controllers/common/packs.js";
import {
  userTokenAuth,
  userTokenAuthuser,
} from "../../middlewares/UserTokenAuth.js";
import upload from "../../middlewares/multer.js";
import profileImageController from "../../controllers/userController/profileImage.controller.js";
const router = Router();

router.get("/get-all-packs", CommonController.getAllPacks);
router.get("/get-all-packs-wallpapers", CommonController.getAllPacksWallPapers);

router.post(
  "/profile/image",
  userTokenAuthuser,
  upload.single("profileImage"),
  profileImageController.uploadProfileImage
);

router.delete(
  "/profile/image",
  userTokenAuthuser,
  profileImageController.deleteProfileImage
);

router.get(
  "/profile",
  userTokenAuthuser,
  profileImageController.getUserProfile
);

export default router;
