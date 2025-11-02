import { Router } from "express";
import UserBattleController from "../../controllers/userController/battle.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.post("/create-battle", userTokenAuth, UserBattleController.createBattle);
router.post("/get-battle-info", UserBattleController.getBattleInfo);
export default router;
