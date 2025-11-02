import mongoose from "mongoose";
import BattleConfig from "../../config/battles.json" with { type: "json" };
import BattleModel from "../../models/Battles.js";
import PackDrawModel from "../../models/Packdraw.js";
import { calculateTotalAmount, deductAmount, getUserBalance } from "../../helpers/common.helper.js";
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
      const selectedBattle = BattleConfig.Battles.find(battle => battle.type === battleType);
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
      const battleAmount = await calculateTotalAmount(packsDet);
      const userBalance = await getUserBalance(new mongoose.Types.ObjectId(userId));
      if (userBalance.total_chip_amount >= battleAmount) {
        await deductAmount(userId, battleAmount)
        const data = await BattleModel.create({ ...req_Body, creatorId: userId, creatorType: "User", battleAmount });
        return {
          code: 200,
          status: true,
          message: "Battle Created Successfully",
          data: data,
        };
      } else {
        return {
          status: 400,
          status: false,
          message: "Insufficient Fund",
        }
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
  getBattleInfo = async (req_Body) => {
    try {
      const { battleId } = req_Body;
      if (!battleId || battleId == "") {
        return {
          status: 400,
          status: false,
          message: "Battle Not Found",
        }
      };

      const data = await BattleModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(battleId),
          },
        },
        {
          $lookup: {
            from: "BattleHistory",
            localField: "_id",
            foreignField: "battleId",
            as: "UsersHistoryDet",
          },
        },
        {
          $lookup:  {
            from: "PackDraw",
            localField: "packsIds",
            foreignField: "_id",
            as: "packsIds",
            pipeline: [
              {
                $lookup: {
                  from: "PacksItems",
                  localField: "items",
                  foreignField: "_id",
                  as: "items"
                }
              },
              {
                $addFields: {
                  wallpaperObjId: {
                    $toObjectId: "$wallpaper"
                  }
                }
              },
              {
                $lookup: {
                  from: "PacksImages",
                  localField: "wallpaperObjId",
                  foreignField: "_id",
                  as: "wallpaper"
                }
              }
            ]
          }
        },
      ]);


      return {
        status: 200,
        status: true,
        message: "Battle info",
        data: data || []
      }

    } catch (error) {
      console.error("getBattleInfo error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  }
}

export default new UserBattlesService();
