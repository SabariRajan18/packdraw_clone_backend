import CommonPacksService from "../../services/commonService/packs.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";

class CommonPacksController {
  getAllPacks = async (req, res) => {
    try {
      const response = await CommonPacksService.getAllPacks(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getAllPacksWallPapers = async (req, res) => {
    try {
      const response = await CommonPacksService.getAllPacksWallPapers(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new CommonPacksController();
