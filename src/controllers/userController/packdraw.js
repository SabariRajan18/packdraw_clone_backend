import UserPacksService from "../../services/userService/packs.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";

class UserBackDrawController {
  SpinPacks = async (req, res) => {
    try {
      const { userId } = req;
      const response = await UserPacksService.spinPacks(userId, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new UserBackDrawController();
