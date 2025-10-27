import CommonBattlesService from "../../services/commonService/battles.service.js";
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
class CommonBattleController {
  getBattleConfigs = async (req, res) => {
    try {
      const response = await CommonBattlesService.getBattleConfigs();
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new CommonBattleController();
