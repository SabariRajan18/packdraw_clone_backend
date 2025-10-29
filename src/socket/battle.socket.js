import mongoose from "mongoose";
import {
  getBattlePlayerCount,
  getUserBalance,
} from "../helpers/common.helper.js";
import BattleModel from "../models/Battles.js";
import BattleHistoryModel from "../models/BattleHistory.js";
import { emitToUser } from "../helpers/socket.helper.js";
export const joinBattle = async (battleConfig) => {
  try {
    const { userId, battleId } = battleConfig;
    const battleDet = await BattleModel.findById({ _id: battleId });
    if (battleDet.status === "Waiting") {
      const totalBattleHis = await BattleHistoryModel.find({ battleId });
      const playerCount = getBattlePlayerCount(
        battleDet.battleType,
        battleDet.players
      );

      if (playerCount > totalBattleHis.length) {
        const userBalance = await getUserBalance(
          new mongoose.Types.ObjectId(userId)
        );

        const existingBattle = await BattleHistoryModel.findOne({
          userId,
          battleId,
        });
        if (!existingBattle) {
          if (userBalance.total_chip_amount >= battleDet.battleAmount) {
            await BattleHistoryModel.create({
              userId,
              battleId,
              battleAmount: battleDet.battleAmount,
            });
            emitToUser(userId, "battle-join-res", {
              type: "success",
              msg: "Successfully Joined Battles",
              id: battleDet._id,
              userId,
            });
          } else {
            emitToUser(userId, "battle-join-res", {
              type: "error",
              msg: "Insufficient Balance",
              userId,
            });
          }
        } else {
          emitToUser(userId, "battle-join-res", {
            type: "success",
            msg: "Already Exist This Battle",
            id: battleDet._id,
            userId,
          });
        }
      } else {
        await BattleModel.updateOne(
          { _id: battleId },
          { $set: { status: "Playing" } }
        );
        emitToUser(userId, "battle-join-res", {
          type: "success",
          msg: "Battles Players Full",
          id: battleDet._id,
          userId,
        });
      }
    } else {
      emitToUser(userId, "battle-join-res", {
        type: "success",
        msg: "Battles Playing",
        id: battleDet._id,
        userId,
      });
    }
  } catch (error) {
    console.error({ joinBattle: error });
  }
};
