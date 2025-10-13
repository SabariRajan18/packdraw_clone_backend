import { Router } from "express";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
import UserAuthController from "../../controllers/userController/auth.js";
const router = Router();

router.post("/register", UserAuthController.register);
router.post("/login", UserAuthController.login);
router.post("/set2FAMode", UserAuthController.set2FAMode);
router.put(
  "/change-password",
  userTokenAuth,
  UserAuthController.changePassword
);
router.put("/update-user", userTokenAuth, UserAuthController.updateUserData);
router.get("/get-user", userTokenAuth, UserAuthController.getUser);

export default router;
