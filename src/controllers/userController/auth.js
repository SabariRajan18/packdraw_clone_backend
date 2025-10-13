import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import UserAuthService from "../../services/userService/auth.service.js";
class UserAuthController {
  register = async (req, res) => {
    try {
      const response = await UserAuthService.register(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  login = async (req, res) => {
    try {
      const response = await UserAuthService.login(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  set2FAMode = async (req, res) => {
    try {
      const response = await UserAuthService.set2FAMode(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  changePassword = async (req, res) => {
    try {
      const response = await UserAuthService.changePassword(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  updateUserData = async (req, res) => {
    try {
      const { userId } = req;
      const response = await UserAuthService.updateUserData(userId, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getUser = async (req, res) => {
    try {
      const { userId } = req;
      const response = await UserAuthService.getUser(userId);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new UserAuthController();
