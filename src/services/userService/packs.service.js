import mongoose from "mongoose";
import UsersModel from "../../models/Users.js";
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemModel from "../../models/PacksItems.js";
import {
  creditAmount,
  deductAmount,
  getUserBalance,
} from "../../helpers/common.helper.js";
import { uploadImage } from "../../config/cloudinary.js";
import SpinHistoryModel from "../../models/SpinHistory.js";
import PacksItemsModel from "../../models/PacksItems.js";
class UserPacksService {
  spinOnePacks = async (userId, req_Body) => {
    try {
      const { packsIds, itemId } = req_Body;
      const userDet = await UsersModel.findOne({ _id: userId });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User Not Found",
          data: null,
        };
      }
      const isPacks = await PackDrawModel.findOne({ _id: packsIds[0] });
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
  getAllPacksId = async () => {
    try {
      const packsIds = await PackDrawModel.find({}, { _id: 1 });
      if (packsIds.length > 0) {
        return {
          code: 200,
          status: true,
          message: "Packs Ids Retrived Successfully",
          data: packsIds,
        };
      } else {
        return {
          code: 403,
          status: false,
          message: "No Packs Found",
          data: null,
        };
      }
    } catch (error) {
      console.error("getAllPacksId error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  getPacksIdsDetails = async (req_Body) => {
    try {
      const { packsId } = req_Body;

      const data = await PackDrawModel.find({
        _id: { $in: packsId.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .populate({
          path: "items", // first populate items
          model: "PacksItems",
        })
        .populate(
          "wallpaper" 
        );
      const formattedData = data.map((pack) => ({
        _id: pack._id,
        name: pack.name,
        wallpaper: pack.wallpaper,
        packAmount: pack.packAmount,
        creator: pack.creator,
        packsItemDet: pack.items,
      }));

      return {
        code: 200,
        status: true,
        message: "Get One Packs Details Retrieved",
        data: formattedData || [],
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

 createPacks = async (req, req_Body) => {
    try {
      console.log("req_Body :>> ", req_Body);
      
      // Validation
      if (!req_Body.name) {
        return {
          code: 400,
          status: false,
          message: "Packs name is required!",
          data: null,
        };
      }
      if (!req_Body.packAmount) {
        return {
          code: 400,
          status: false,
          message: "Pack amount is required!",
          data: null,
        };
      }
      if (!req_Body.outCome) {
        return {
          code: 400,
          status: false,
          message: "Outcome percentage is required!",
          data: null,
        };
      }
      if (!req_Body.wallpaper || !req_Body.wallpaper._id) {
        return {
          code: 400,
          status: false,
          message: "Wallpaper is required!",
          data: null,
        };
      }
      if (!req_Body.items || !Array.isArray(req_Body.items) || req_Body.items.length === 0) {
        return {
          code: 400,
          status: false,
          message: "At least one item is required!",
          data: null,
        };
      }

      // Extract item IDs from the items array
      const itemIds = req_Body.items.map(item => {
        // Handle both object with id property and direct ID string
        return item.id || item;
      }).filter(id => id); // Remove any null/undefined values

      // Validate that we have valid item IDs
      if (itemIds.length === 0) {
        return {
          code: 400,
          status: false,
          message: "Valid items are required!",
          data: null,
        };
      }

      // Create the pack
      const packsDet = await PackDrawModel.create({
        name: req_Body.name,
        packAmount: req_Body.packAmount,
        wallpaper: req_Body.wallpaper._id, // Store only the ObjectId
        creator: "User",
        creatorId: req.userId,
        outCome: req_Body.outCome,
        items: itemIds, // Store array of ObjectIds
      });

    
      return {
        code: 200,
        status: true,
        message: "Pack Created Successfully",
        
      };
    } catch (error) {
      console.log({ createPacks: error });
      
      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        return {
          code: 400,
          status: false,
          message: "Validation Error: " + error.message,
          data: null,
        };
      }
      
      if (error.name === 'CastError') {
        return {
          code: 400,
          status: false,
          message: "Invalid ID format",
          data: null,
        };
      }

      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  getItems = async (query = {}) => {
    try {
      const { page = 1, limit = 100, search = "" } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const items = await PacksItemsModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PacksItemsModel.countDocuments(filter);

      return {
        code: 200,
        status: true,
        message: "Items retrieved successfully",
        data: {
          items,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
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
}

export default new UserPacksService();
