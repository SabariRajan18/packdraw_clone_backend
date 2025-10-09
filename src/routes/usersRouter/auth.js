import { Router } from "express";
import UserAuthController from "../../controllers/userController/auth.js";
const router = Router();

router.post("/register", UserAuthController.register);
router.post("/login", UserAuthController.login);
router.post("/set2FAMode",UserAuthController.set2FAMode);
router.post("/change-password",UserAuthController.changePassword)


export default router;
