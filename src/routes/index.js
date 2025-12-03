import { Router } from "express";
const router = Router();
// USERS
import userBackdrawRouters from "./usersRouter/packdraw.js";
import userDealsRouters from "./usersRouter/deals.js";
import userAuthRouters from "./usersRouter/auth.js";
import userDrawRouters from "./usersRouter/draw.js";
import cartApi from "./usersRouter/cart.js";
// ADMIN
import adminBackdrawRouters from "./adminRouter/packdraw.js";
import adminBattleRouters from "./adminRouter/battle.js";
import adminSpinRouters from "./adminRouter/spin.js";
import adminAuthRouters from "./adminRouter/auth.js";
import paymentRouter from "./payment/payment.js";

// COMMON
import commonApi from "./common/index.js";

// USER ROUTERS
router.use("/v1/users/auth", userAuthRouters);
router.use("/v1/users/packdraw", userBackdrawRouters);
router.use("/v1/users/deals", userDealsRouters);
router.use("/v1/users/draw", userDrawRouters);
router.use("/v1/users/cart", cartApi);

// ADMIN ROUTERS
router.use("/v2/admin/packdraw", adminBackdrawRouters);
router.use("/v2/admin/battles", adminBattleRouters);
router.use("/v2/admin/deals", adminSpinRouters);
router.use("/v2/admin/auth", adminAuthRouters);

// COMMON ROUTER
router.use("/common-api", commonApi);

//payment Router
router.use("/payment", paymentRouter);

export default router;
