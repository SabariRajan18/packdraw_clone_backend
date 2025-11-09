import { Router } from "express";
import UserDealsController from "../../controllers/userController/deals.js";
const router = Router();

router.get("/get-all-items", UserDealsController.getAllItems);

export default router;
