// controllers/adminController/auth.controller.js
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import AdminAuthService from "../../services/adminService/auth.service.js";

class AdminAuthController {
  login = async (req, res) => {
    try {
      const response = await AdminAuthService.login(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  createAdmin = async (req, res) => {
    try {
      const response = await AdminAuthService.createAdmin(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getAdmins = async (req, res) => {
    try {
      const response = await AdminAuthService.getAdmins();
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getAdminById = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminAuthService.getAdminById(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updateAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminAuthService.updateAdmin(id, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updateAdminPassword = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminAuthService.updateAdminPassword(id, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  deleteAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminAuthService.deleteAdmin(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminAuthController();