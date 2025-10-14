import mongoose from "mongoose";
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemsModel from "../../models/PacksItems.js";
class CommonPacksService {
  getAllPacks = async (req_Query) => {
    try {
      const page = parseInt(req_Query.page) || 1;
      const limit = parseInt(req_Query.limit) || 10;
      const skip = (page - 1) * limit;

      const allData = await PackDrawModel.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      const total = await PackDrawModel.countDocuments();
      return {
        status: true,
        message: "Packs fetched successfully",
        data: {
          allData: allData || [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
      };
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  getOnePacksDetails = async (req_Body) => {
    try {
      console.log({ req_Body });
      const { packsId } = req_Body;
      const data = await PackDrawModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(packsId),
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $lookup: {
            from: "PacksItems",
            localField: "items",
            foreignField: "_id",
            as: "itemsData",
          },
        },
        {
          $unwind: {
            path: "$itemsData",
          },
        },
      ]);
      let packsDet = {};
      if (data.length > 0) {
        const packsItemDet = data.map((item) => item.itemsData);
        packsDet.packsItemDet = packsItemDet;
        packsDet.name = data[0].name;
        packsDet.wallpaper = data[0].wallpaper;
        packsDet.packAmount = data[0].packAmount;
        packsDet.creator = data[0].creator;
      }
      return {
        code: 200,
        status: true,
        message: "Get One Packs Details Retrived",
        data: packsDet,
      };
    } catch (error) {
      console.log({ getOnePacksDetails: error });
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}
export default new CommonPacksService();
