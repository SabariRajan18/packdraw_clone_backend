// routes/battleRoutes.js
import express from "express"
import { authMiddleware } from "../middlewares/auth.js";
import battleController from "../controllers/battleController.js";
const router = express.Router();

router.use(authMiddleware);

// Create new battle
router.post('/create', battleController.createBattle);

// Join existing battle
router.post('/:battleId/join', battleController.joinBattle);

// Get waiting battles (public)
router.get('/waiting', battleController.getWaitingBattles);

// Get battle details
router.get('/:battleId', battleController.getBattleDetails);

// Add bot to battle
router.post('/:battleId/add-bot', battleController.addBot);

// Start battle
router.post('/:battleId/start', battleController.startBattle);

// Cancel battle
router.post('/:battleId/cancel', battleController.cancelBattle);

// Get user's battles
router.get('/user/my-battles', battleController.getMyBattles);

export default router;