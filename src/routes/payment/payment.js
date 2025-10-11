import express from "express";
import PaymentController from "../../controllers/userController/payments.js";
const router = express.Router();

router.post("/create", PaymentController.createPayment);
router.post("/withdraw", PaymentController.withdrawRequest);
router.post("/verify-withdraw-otp", PaymentController.verifyOtpWithdraw);
router.get("/config", PaymentController.getPaymentConfig);
router.post("/lowbalance", PaymentController.toggleLowBalance);
router.post("/paycallback", PaymentController.payCallBack); 

export default router;
