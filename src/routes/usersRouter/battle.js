import { Router } from "express";
import UserBattleController from "../../controllers/userController/battle.js";
const router = Router();

router.post("/create-battle", UserBattleController.createBattle);

export default router;
