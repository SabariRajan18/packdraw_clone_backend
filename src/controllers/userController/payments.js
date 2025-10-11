import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import PaymentService from "../../services/userService/payment.service.js";

export default new class PaymentController {
  createPayment = async (req, res) => {
    try {
      const response = await PaymentService.createPayment(req.body, res.locals.userPayload);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  withdrawRequest = async (req, res) => {
    try {
      const response = await PaymentService.withdrawRequest(req.body, res.locals.userPayload);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  verifyOtpWithdraw = async (req, res) => {
    try {
      const response = await PaymentService.verifyOtpWithdraw(req.body, res.locals.userPayload);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getPaymentConfig = async (req, res) => {
    try {
      const response = await PaymentService.getPaymentConfig();
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  toggleLowBalance = async (req, res) => {
    try {
      const { id } = req.body;
      const response = await PaymentService.toggleLowBalance(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  payCallBack = async (req, res) => {
    try {
      const response = await PaymentService.payCallBack(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

