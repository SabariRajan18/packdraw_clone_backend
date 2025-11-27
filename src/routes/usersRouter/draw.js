import { Router } from "express";
import UserDrawController from "../../controllers/userController/draw.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
import upload from "../../middlewares/multer.js";
const router = Router();

router.post(
  "/spin-draw-product",
  userTokenAuth,
  UserDrawController.getDrawProduct
);

router.post(
  "/spin-draw-again",
  userTokenAuth,
  UserDrawController.spinDrawAgain
);

router.post(
  "/claim-draw",
  userTokenAuth,
  UserDrawController.claimDraw
);

export default router;
