import { Router } from "express";
import UserPackDrawController from "../../controllers/userController/packdraw.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
import upload from "../../middlewares/multer.js";

const router = Router();

router.post(
  "/spin-one-packs",
  userTokenAuth,
  UserPackDrawController.spinOnePacks
);
router.get("/get-all-packsid", UserPackDrawController.getAllPacksId);
router.post(
  "/get-packs-ids-details",
  UserPackDrawController.getPacksIdsDetails
);
router.post(
  "/create-packs",
  userTokenAuth,
  upload.single("file"),
  UserPackDrawController.createPacks
);
export default router;
