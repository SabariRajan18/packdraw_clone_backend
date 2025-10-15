import { Router } from "express";
import UserBackDrawController from "../../controllers/userController/packdraw.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.post("/spin-one-packs", userTokenAuth, UserBackDrawController.spinOnePacks);

export default router;
