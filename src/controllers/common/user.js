import PacksModel from "../../models/PacksSpinHistory.js";
import BattleModel from "../../models/BattleHistory.js";
import DealsModel from "../../models/DealsSpinHistory.js";
import DrawsModel from "../../models/DrawSpinHistory.js";

export const getAllHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { module, page = 1, limit = 20 } = req.body;

    const Model = {
      packs: PacksModel,
      battles: BattleModel,
      deals: DealsModel,
      draws: DrawsModel,
    };

    if (!Model[module]) {
      return res.status(400).json({
        status: false,
        message: "Invalid module type",
      });
    }
    const skip = (page - 1) * limit;
    const totalCount = await Model[module].countDocuments({ userId });

    const data = await Model[module].aggregate([
      {
        $match: { userId: userId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: Number(limit),
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "History fetched successfully",
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data,
    });
  } catch (error) {
    console.error({ getAllHistory: error });
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
