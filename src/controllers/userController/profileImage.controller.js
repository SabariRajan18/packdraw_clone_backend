// controllers/userController/profileImage.controller.js
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import ProfileImageService from "../../services/userService/profileImage.service.js";
import PacksModel from "../../models/PacksSpinHistory.js";
import BattleModel from "../../models/BattleHistory.js";
import DealsModel from "../../models/DealsSpinHistory.js";
import DrawsModel from "../../models/DrawSpinHistory.js";
class ProfileImageController {
  uploadProfileImage = async (req, res) => {
    try {
      const { userId } = req.user; // Assuming you have user info in req.user from auth middleware
      const file = req.file;

      const response = await ProfileImageService.uploadProfileImage(
        userId,
        file
      );
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  deleteProfileImage = async (req, res) => {
    try {
      const { userId } = req.user;

      const response = await ProfileImageService.deleteProfileImage(userId);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getUserProfile = async (req, res) => {
    try {
      const { userId } = req.user;

      const response = await ProfileImageService.getUserProfile(userId);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getCartDatas = async (req, res) => {
    try {
      const { userId } = req.user;
      const response = await ProfileImageService.getCartDatas(
        userId,
        req.body,
        req.query
      );
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getAllHistory = async (req, res) => {
    try {
      const { userId } = req.user;
      const response = await ProfileImageService.getAllHistory(
        userId,
        req.body
      );
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new ProfileImageController();
