import { Router } from "express";
import UserDealsController from "../../controllers/userController/deals.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.get("/get-all-items", UserDealsController.getAllItems);
router.post("/deal-spin", userTokenAuth, UserDealsController.dealSpin);

export default router;
