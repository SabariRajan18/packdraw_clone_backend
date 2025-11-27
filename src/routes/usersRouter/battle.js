import { Router } from "express";
import battleController from "../../controllers/userController/battleController.js";

import { rateLimitAPI } from "../../middlewares/rateLimit.js";
import { userTokenAuthuser } from "../../middlewares/UserTokenAuth.js";

const router = Router();

// Public routes
router.get("/all-battles", rateLimitAPI(20, 60000), battleController.getAllBattles);
router.get("/:battleId", rateLimitAPI(20, 60000), battleController.getBattleInfo);

// Protected routes
router.post("/create-battle", userTokenAuthuser, rateLimitAPI(10, 60000), battleController.createBattle);
router.post("/join-battle", userTokenAuthuser, rateLimitAPI(10, 60000), battleController.joinBattle);
router.post("/start-battle", userTokenAuthuser, rateLimitAPI(10, 60000), battleController.startBattle);
router.post("/open-pack", userTokenAuthuser, rateLimitAPI(20, 60000), battleController.openPack);
router.post("/complete-battle", userTokenAuthuser, rateLimitAPI(10, 60000), battleController.completeBattle);
router.get("/my-battles/all", userTokenAuthuser, rateLimitAPI(20, 60000), battleController.getUserBattles);

export default router;