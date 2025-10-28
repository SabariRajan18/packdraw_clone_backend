import mongoose from "mongoose";
import BattleConfig from "../../config/battles.json" with { type: "json" };
import BattleModel from "../../models/Battles.js";
import PackDrawModel from "../../models/Packdraw.js";
class UserBattlesService {
  createBattle = async (userId, req_Body) => {
    try {
      const { name, battleType, players, battleGameMode, packsIds } = req_Body;
      
      if (!battleType) {
        return {
          status: 400,
          status: false,
          message: "battleType is required",
        };
      };
      const selectedBattle = BattleConfig.Battles.find(battle=>battle.type === battleType);
      if (!selectedBattle || Object.keys(selectedBattle).length <= 0) {
        return {
          status: 400,
          status: false,
          message: "Missing Battle Configs or Invalid Battle type",
        };
      };
      if (!players) {
        return { status: 400, status: false, message: "players is required" };
      };
      if (!selectedBattle.players.includes(players)) {
        return { status: 400, status: false, message: "Invalid players" };
      };
      if (!battleGameMode) {
        return {
          status: 400,
          status: false,
          message: "battleGameMode is required",
        };
      };
      if (!selectedBattle.gameMode.includes(battleGameMode)) {
        return { status: 400, status: false, message: "Invalid Game Mode" };
      }
      if (!Array.isArray(packsIds) || packsIds.length === 0) {
        return {
          status: 400,
          status: false,
          message: "packsIds must be a non-empty array",
        };
      }
      const packsDet = await PackDrawModel.find({
              _id: { $in: packsIds.map((id) => new mongoose.Types.ObjectId(id)) },
            });
            const battleAmount = await calculateTotalAmount(packsDet)
      const data = await BattleModel.create({ ...req_Body, userId,battleAmount });
      return {
        code: 200,
        status: true,
        message: "Battle Created Successfully",
        data: data,
      };
    } catch (error) {
      console.error("createBattle error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}

export default new UserBattlesService();
