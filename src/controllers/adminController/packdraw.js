import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import AdminPackDrawService from "../../services/adminService/packdraw.service.js";
class AdminBackDrawController {
  addPacks = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacks(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  updatePacks = async (req, res) => {
    try {
      const response = await AdminPackDrawService.updatePacks(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  addPacksItems = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacksItems(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  removePacksItems = async (req, res) => {
    try {
      const response = await AdminPackDrawService.removePacksItems(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  addPacksProducts = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacksProducts(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  updatePacksProducts = async (req, res) => {
    try {
      const response = await AdminPackDrawService.updatePacksProducts(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminBackDrawController();
