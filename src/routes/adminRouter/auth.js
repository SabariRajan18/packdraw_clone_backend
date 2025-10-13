// routes/admin.js
import { Router } from "express";
import AdminPackDrawController from "../../controllers/adminController/packdraw.js";
import AdminUserController from "../../controllers/adminController/user.controller.js";
import AdminTransactionController from "../../controllers/adminController/transaction.controller.js";
import AdminAuthController from "../../controllers/adminController/auth.js";

const router = Router();

router.post("/login", AdminAuthController.login);
router.post("/create",  AdminAuthController.createAdmin);
router.get("/admins",  AdminAuthController.getAdmins);
router.get("/admin/:id",  AdminAuthController.getAdminById);
router.put("/admin/:id",  AdminAuthController.updateAdmin);
router.put("/admin/:id/password",  AdminAuthController.updateAdminPassword);
router.delete("/admin/:id",  AdminAuthController.deleteAdmin);

// Pack routes
router.get("/packs",  AdminPackDrawController.getPacks);
router.get("/packs/:id",  AdminPackDrawController.getPackById);
router.post("/packs", AdminPackDrawController.addPacks);
router.put("/packs", AdminPackDrawController.updatePacks);
router.delete("/packs/:id",  AdminPackDrawController.deletePack);

// Pack items management routes
router.post("/packs/items",  AdminPackDrawController.addPacksItems);
router.delete("/packs/items",  AdminPackDrawController.removePacksItems);

router.get("/items",  AdminPackDrawController.getItems);
router.get("/items/:id",  AdminPackDrawController.getItemById);
router.post("/items", AdminPackDrawController.addPacksProducts);
router.put("/items", AdminPackDrawController.updatePacksProducts);
router.delete("/items/:id",  AdminPackDrawController.deleteItem);

router.get("/packs-stats",  AdminPackDrawController.getPackStats);

router.get("/users",  AdminUserController.getUsers);
router.get("/users/:id",  AdminUserController.getUserById);
router.put("/users/:id",  AdminUserController.updateUser);
router.patch("/users/:id/toggle-status",  AdminUserController.toggleUserStatus);
router.get("/users/:id/transactions",  AdminUserController.getUserTransactions);

router.get("/transactions",  AdminTransactionController.getTransactions);
router.get("/transactions/deposits",  AdminTransactionController.getDeposits);
router.get("/transactions/withdrawals",  AdminTransactionController.getWithdrawals);
router.put("/transactions/:id/status",  AdminTransactionController.updateTransactionStatus);

router.get("/dashboard/stats",  AdminTransactionController.getDashboardStats);

export default router;