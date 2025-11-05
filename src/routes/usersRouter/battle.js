import { Router } from "express";
import UserBattleController from "../../controllers/userController/battle.js";
import { userTokenAuth } from "../../middlewares/UserTokenAuth.js";
const router = Router();

router.post("/create-battle", userTokenAuth, UserBattleController.createBattle);
router.post("/get-battle-info", UserBattleController.getBattleInfo);
router.get('/all-battles',userTokenAuth,UserBattleController.getAllBattles);
router.get('/:battleId',userTokenAuth,UserBattleController.getBattleInfo);
router.get('/my-battles',userTokenAuth,UserBattleController.getUserBattles);



export default router;
