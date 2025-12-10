import { Router } from "express";
import CommonBattleController from "../../controllers/common/battles.js";
import CommonPacksController from "../../controllers/common/packs.js";
import {
  userTokenAuth,
  userTokenAuthuser,
} from "../../middlewares/UserTokenAuth.js";
import upload from "../../middlewares/multer.js";
import profileImageController from "../../controllers/userController/profileImage.controller.js";
const router = Router();

// Packs
router.get("/get-all-packs", CommonPacksController.getAllPacks);
router.get(
  "/get-all-packs-wallpapers",
  CommonPacksController.getAllPacksWallPapers
);

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

router.post(
  "/get-cart-datas",
  userTokenAuthuser,
  profileImageController.getCartDatas
);
// Battles

router.get("/get-battle-configs", CommonBattleController.getBattleConfigs);

router.post(
  "/get-all-history",
  userTokenAuthuser,
  profileImageController.getAllHistory
);

export default router;