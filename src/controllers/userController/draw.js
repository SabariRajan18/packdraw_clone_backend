import UserDrawsService from "../../services/userService/draw.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
class UserDrawController {
  getDrawProduct = async (req, res) => {
    try {
      const response = await UserDrawsService.getDrawProducts(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  spinDrawAgain = async (req, res) => {
    try {
      const response = await UserDrawsService.spinDrawAgain(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  claimDraw = async (req, res) => {
    try {
      const response = await UserDrawsService.claimDraw(req, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}
export default new UserDrawController();
