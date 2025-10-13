// controllers/adminController/transaction.controller.js
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import AdminTransactionService from "../../services/adminService/transaction.service.js";

class AdminTransactionController {
  getTransactions = async (req, res) => {
    try {
      const response = await AdminTransactionService.getTransactions(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getDeposits = async (req, res) => {
    try {
      const response = await AdminTransactionService.getDeposits(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getWithdrawals = async (req, res) => {
    try {
      const response = await AdminTransactionService.getWithdrawals(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updateTransactionStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const response = await AdminTransactionService.updateTransactionStatus(id, status);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getDashboardStats = async (req, res) => {
    try {
      const response = await AdminTransactionService.getDashboardStats();
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminTransactionController();