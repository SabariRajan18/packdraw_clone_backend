import UserBattlesService from "../../services/userService/battles.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
class UserBattleController {
  createBattle = async (req, res) => {
    try {
      const { userId } = req;
      const response = await UserBattlesService.createBattle(userId, req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}
export default new UserBattleController();
