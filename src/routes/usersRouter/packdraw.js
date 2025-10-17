import { Router } from "express";
import UserPackDrawController from "../../controllers/userController/packdraw.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.post(
  "/spin-one-packs",
  userTokenAuth,
  UserPackDrawController.spinOnePacks
);
router.get("/get-all-packsid", UserPackDrawController.getAllPacksId);
router.post("/get-packs-ids-details", UserPackDrawController.getPacksIdsDetails);

export default router;
