import { Router } from "express";
import CommonController from "../../controllers/common/packs.js";
const router = Router();

router.get("/get-all-packs", CommonController.getAllPacks);

export default router;
