import mongoose from "mongoose";
import {
  deductAmount,
  getUserBalance,
  randomBetween,
  shuffleArray,
  WithoutRounding,
} from "../../helpers/common.helper.js";
import DrawProductsModel from "../../models/DrawProducts.js";
import DrawSpinHistoryModel from "../../models/DrawSpinHistory.js";

class UserDrawsService {
  getDrawProducts = async (request, req_Body) => {
    try {
      const { userId } = request;
      const { type, amount } = req_Body;
      console.log({ req_Body });
      if (!type) {
        return {
          code: 400,
          status: false,
          message: "Type Required",
          data: null,
        };
      }
      const balance = await getUserBalance(userId);
      console.log(balance.total_chip_amount, "balance.total_chip_amount");
      if (amount > balance.total_chip_amount) {
        return {
          code: 400,
          status: false,
          message: "Insufficient Balance",
          data: [],
        };
      }
      const isDebited = await deductAmount(userId, amount);
      if (isDebited) {
        const data = await DrawProductsModel.aggregate([
          { $match: { tier: type.toLowerCase() } },
          { $sample: { size: 1 } },
        ]);

        const updatedData = Array.from({ length: 9 }).map((item) => ({
          ...data[0],
          status: "success",
          multiplierIndex: 0,
          price: WithoutRounding(amount / 9, 2),
          flipped: true,
          rotate: 180,
        }));

        return {
          code: 200,
          status: true,
          message: "Success",
          data: updatedData,
        };
      }
    } catch (error) {
      console.error({ getDrawProducts: error });
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  spinDrawAgain = async (request, req_Body) => {
    try {
      const { userId } = request;
      const {
        type,
        multiplayer,
        multiplierIndex = 0,
        amount,
        excludeIds = [],
      } = req_Body;

      if (!type) {
        return {
          code: 400,
          status: false,
          message: "Type Required",
          data: null,
        };
      }

      if (!multiplayer) {
        return {
          code: 400,
          status: false,
          message: "Multiplier Required",
          data: null,
        };
      }

      const roundCardCount = {
        1: randomBetween(6, 8),
        2: randomBetween(6, 7),
        3: randomBetween(4, 5),
        4: randomBetween(2, 4),
        5: randomBetween(2, 5),
        6: randomBetween(0, 4),
        7: randomBetween(0, 3),
        8: randomBetween(0, 2),
        9: randomBetween(0, 1),
      };

      const count = Number(roundCardCount[Number(multiplierIndex)] || 1);
      const excludeObjectIds = excludeIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      const data = await DrawProductsModel.aggregate([
        {
          $match: {
            tier: type.toLowerCase(),
            _id: { $nin: excludeObjectIds },
          },
        },
        { $sample: { size: 1 } },
      ]);
      const multiPlayerVal = String(multiplayer).split("x")[1];

      const updatedData = Array.from({ length: count }).map(() => ({
        ...data[0],
        status: "success",
        multiplayer,
        multiplierIndex,
        price: WithoutRounding((amount / 9) * Number(multiPlayerVal), 2),
        flipped: true,
        rotate: 180,
      }));

      while (updatedData.length < 9) {
        updatedData.push({
          status: "fail",
          multiplayer,
          multiplierIndex,
          flipped: false,
          rotate: 180,
          price: 0,
        });
      }
      const finalValArr = shuffleArray(updatedData);
      return {
        code: 200,
        status: true,
        message: "Success",
        data: finalValArr,
      };
    } catch (error) {
      console.error("spinDrawAgain error", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  claimDraw = async (req, req_Body) => {
    try {
      const { userId } = req;
      if (!Array.isArray(req_Body)) {
        return {
          code: 400,
          status: false,
          message: "Can't Claim your product",
          data: null,
        };
      }
      const insertData = req_Body.map((item) => ({
        userId: userId,
        drawProductId: item._id,
        amount: item.price,
      }));
      const data = await DrawSpinHistoryModel.insertMany(insertData);
      return {
        code: 200,
        status: true,
        message: "Claimed Successfully",
        data: data,
      };
    } catch (error) {
      console.error("Claim Draw", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}
export default new UserDrawsService();
