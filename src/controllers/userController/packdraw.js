import UserPacksService from "../../services/userService/packs.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";

class UserBackDrawController {
  spinPacks = async (req, res) => {
    try {
      const { userId } = req;
      const response = await UserPacksService.spinPacks(userId, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getAllPacksId = async (req, res) => {
    try {
      const response = await UserPacksService.getAllPacksId();
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getPacksIdsDetails = async (req, res) => {
    try {
      const response = await UserPacksService.getPacksIdsDetails(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  createPacks = async (req, res) => {
    try {
      const response = await UserPacksService.createPacks(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getItems = async (req, res) => {
    try {
      const response = await UserPacksService.getItems(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new UserBackDrawController();
