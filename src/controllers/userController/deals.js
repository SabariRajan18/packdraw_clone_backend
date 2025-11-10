import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import UserDealsService from "../../services/userService/deals.service.js";
class AdminDealsController {
  getAllItems = async (req, res) => {
    try {
      const response = await UserDealsService.getAllItems(req, req.query);
      await successResponse(req, res, response);
    } catch (error) {
      console.error({ getAllItems: error });
      await errorResponse(req, res, error);
    }
  };
  dealSpin = async (req, res) => {
    try {
      const response = await UserDealsService.dealSpinService(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      console.error({ getAllItems: error });
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminDealsController();
