// controllers/adminController/user.controller.js
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import AdminUserService from "../../services/adminService/user.service.js";

class AdminUserController {
  getUsers = async (req, res) => {
    try {
      const response = await AdminUserService.getUsers(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminUserService.getUserById(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminUserService.updateUser(id, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  toggleUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminUserService.toggleUserStatus(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getUserTransactions = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminUserService.getUserTransactions(id, req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminUserController();