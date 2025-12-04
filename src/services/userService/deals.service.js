import PacksItems from "../../models/PacksItems.js";
import DealsSpinHistoryModel from "../../models/DealsSpinHistory.js";
import {
  addExperience,
  creditAmount,
  deductAmount,
  getUserBalance,
} from "../../helpers/common.helper.js";
import PacksItemModel from "../../models/PacksItems.js";
class UserDealsService {
  getAllItems = async (reqQuery) => {
    try {
      let where = {};
      const { limit = 50, page = 1, price = 1, min, max, search } = reqQuery;

      if (min !== undefined && min !== "" && !isNaN(min)) {
        where.amount = { ...where.amount, $gte: Number(min) };
      }

      if (max !== undefined && max !== "" && !isNaN(max)) {
        where.amount = { ...where.amount, $lte: Number(max) };
      }

      if (search && search.trim() !== "") {
        where.name = { $regex: search.trim(), $options: "i" }; // case-insensitive search
      }

      const skip = (Number(page) - 1) * Number(limit);

      const sortOption = { amount: Number(price) };

      // ✅ Fetch data
      const data = await PacksItems.find(where)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit));

      const total = await PacksItems.countDocuments(where);

      return {
        code: 200,
        status: true,
        message: "All Items Data",
        data: {
          data,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (error) {
      console.error("getAllItems error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  dealSpinService = async (request, req_Body) => {
    try {
      const { userId } = request;
      const { rewardItemId, amount, outComePer } = req_Body;
      const userDet = await UsersModel.findOne({ _id: userId });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User Not Found",
          data: null,
        };
      }
      const userBalance = await getUserBalance(userId);
      if (userBalance.total_chip_amount >= amount) {
        const rewardDet = await PacksItemModel.findOne({ _id: rewardItemId });
        const isDeducted = await deductAmount(userId, amount);
        // const isCredited = await creditAmount(userId, rewardDet.amount);
        await addExperience(userDet, amount);
        const spinHistory = await DealsSpinHistoryModel.create({
          userId,
          rewardItemId,
          amount,
          outComePer,
          rewardAmount: rewardDet.amount,
        });
        if (isDeducted) {
          return {
            code: 200,
            status: true,
            message: "Deal Spinned Successfully",
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
      console.error("dealSpinService error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}

export default new UserDealsService();
