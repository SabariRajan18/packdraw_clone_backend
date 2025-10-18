import { Router } from "express";
const router = Router();
import upload from "../../middlewares/multer.js";
import AdminPacksDrawController from "../../controllers/adminController/packdraw.js";

router.post("/", (req, res) => res.send("working"));
router.post(
  "/add-packs",
  upload.single("file"),
  AdminPacksDrawController.addPacks
);

router.post(
  "/update-packs",
  upload.single("file"),
  AdminPacksDrawController.updatePacks
);

router.post("/add-packs-items", AdminPacksDrawController.addPacksItems);
router.post("/remove-packs-items", AdminPacksDrawController.removePacksItems);

router.post(
  "/add-packs-products",
  upload.single("file"),
  AdminPacksDrawController.addPacksProducts
);

router.post(
  "/update-packs-products",
  upload.single("file"),
  AdminPacksDrawController.updatePacksProducts
);

router.post(
  "/create-packs-images",
  upload.single("file"),
  AdminPacksDrawController.createPacksImages
);
export default router;
