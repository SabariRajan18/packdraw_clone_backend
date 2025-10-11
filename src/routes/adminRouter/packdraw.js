import { Router } from "express";
const router = Router();
import upload from "../../middlewares/multer.js";
import AdminBackDrawController from "../../controllers/adminController/packdraw.js";

router.post("/", (req, res) => res.send("working"));
router.post(
  "/add-packs",
  upload.single("file"),
  AdminBackDrawController.addPacks
);

router.post(
  "/update-packs",
  upload.single("file"),
  AdminBackDrawController.updatePacks
);

router.post("/add-packs-items", AdminBackDrawController.addPacksItems);
router.post("/remove-packs-items", AdminBackDrawController.removePacksItems);

router.post(
  "/add-packs-products",
  upload.single("file"),
  AdminBackDrawController.addPacksProducts
);

router.post(
  "/update-packs-products",
  upload.single("file"),
  AdminBackDrawController.updatePacksProducts
);

export default router;
