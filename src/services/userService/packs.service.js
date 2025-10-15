import UsersModel from "../../models/Users.js";
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemModel from "../../models/PacksItems.js";
import {
  creditAmount,
  deductAmount,
  getUserBalance,
} from "../../helpers/common.helper.js";
import SpinHistoryModel from "../../models/SpinHistory.js";
class UserPacksService {
  spinOnePacks = async (userId, req_Body) => {
    try {
      const { packsId, itemId } = req_Body;
      const userDet = await UsersModel.findOne({ _id: userId });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User Not Found",
          data: null,
        };
      }
      const isPacks = await PackDrawModel.findOne({ _id: packsId });
      if (!isPacks) {
        return {
          code: 403,
          status: false,
          message: "Packs Not Found",
          data: null,
        };
      }

      const isPacksItem = await PacksItemModel.findOne({ _id: itemId });
      if (!isPacksItem) {
        return {
          code: 403,
          status: false,
          message: "Packs Item Not Found",
          data: null,
        };
      }
      const userBalance = await getUserBalance(userId);
      console.log(userBalance.total_chip_amount, isPacks.packAmount);
      if (userBalance.total_chip_amount >= isPacks.packAmount) {
        const isDeducted = await deductAmount(userId, isPacks.packAmount);
        const isCredited = await creditAmount(userId, isPacksItem.amount);
        const spinHistory = await SpinHistoryModel.create({
          userId: userId,
          packsId: isPacks._id,
          spinAmount: isPacks.packAmount,
          rewardItemId: itemId,
          rewardAmount: isPacksItem.amount,
        });
        if (isDeducted && isCredited) {
          return {
            code: 200,
            status: true,
            message: "Packs Spinned Successfully",
            data: spinHistory,
          };
        }
      } else {
        return {
          code: 403,
          status: false,
          message: "Insufficient Fund",
          data: null,
        };
      }
    } catch (error) {
      console.error("spinOnePacks error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}

export default new UserPacksService();
