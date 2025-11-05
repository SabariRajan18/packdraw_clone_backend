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
  getBattleInfo = async (req, res) => {
    try {
      const{ battleId }=req.params;
      const response = await UserBattlesService.getBattleInfo(req.body,battleId);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getUserBattles = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10,
        status,
        type = 'all'
      } = req.query;
      const response = await UserBattlesService.getUserBattles(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type
      });
  
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
  getAllBattles = async (req, res) => {
    try {
      const { userId } = req;
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        battleType,
        status,
        players,
        search 
      } = req.query;
      const response = await UserBattlesService.getAllBattles(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        battleType,
        status,
        players,
        search
      });
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  }
}
export default new UserBattleController();
