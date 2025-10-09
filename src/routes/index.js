import { Router } from "express";
const router = Router();
// USERS
import userBackdrawRouters from "./usersRouter/packdraw.js";
import userBattleRouters from "./usersRouter/battle.js";
import userSpinRouters from "./usersRouter/spin.js";
import userAuthRouters from "./usersRouter/auth.js";
// ADMIN
import adminBackdrawRouters from "./adminRouter/packdraw.js";
import adminBattleRouters from "./adminRouter/battle.js";
import adminSpinRouters from "./adminRouter/spin.js";
import adminAuthRouters from "./adminRouter/auth.js";
// COMMON
import commonApi from "./common/index.js";

// USER ROUTERS
router.use("/v1/users/packdraw", userBackdrawRouters);
router.use("/v1/users/battle", userBattleRouters);
router.use("/v1/users/spin", userSpinRouters);
router.use("/v1/users/auth", userAuthRouters);

// ADMIN ROUTERS
router.use("/v2/admin/packdraw", adminBackdrawRouters);
router.use("/v2/admin/battle", adminBattleRouters);
router.use("/v2/admin/spin", adminSpinRouters);
router.use("/v2/admin/auth", adminAuthRouters);

// COMMON ROUTER
router.use("/common-api", commonApi);

export default router;
