import { Router } from "express";
import { sellProducts } from "../../controllers/userController/cart.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.post("/sell-product", userTokenAuth, sellProducts);

export default router;
