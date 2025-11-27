import mongoose from "mongoose";
import UsersModel from "../../models/Users.js";
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemModel from "../../models/PacksItems.js";
import PacksSpendModel from "../../models/UserPacksSpend.js";
import {
  calculateTotalAmount,
  calculateTotalRewardAmount,
  creditAmount,
  deductAmount,
  getOneRandomId,
  getOrCreateUserSpends,
  getUserBalance,
  rewardScript,
} from "../../helpers/common.helper.js";
import { uploadImage } from "../../config/cloudinary.js";
import SpinHistoryModel from "../../models/SpinHistory.js";
import PacksItemsModel from "../../models/PacksItems.js";
class UserPacksService {
  getRewardIds = async (userId, req_Body) => {
    try {
      const { packsIds } = req_Body;
      if (packsIds?.length <= 0) {
        return {
          code: 403,
          status: false,
          message: "Packs Id Not Found",
          data: null,
        };
      }

      // user spending datas
      const userSpends = await getOrCreateUserSpends(packsIds);
      const formattedUserSpends = packsIds.flatMap((id) => {
        const found = userSpends.find(
          (d) => d._id.toString() === id.toString()
        );
        return found ? [found] : [];
      });

      // pack draw datas
      const packDrawData = await PackDrawModel.find({
        _id: { $in: packsIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
      const formattedPackDraw = packsIds.flatMap((id) => {
        const found = packDrawData.find(
          (d) => d._id.toString() === id.toString()
        );
        return found ? [found] : [];
      });

      let allRewardIds = [];
      // if (formattedPackDraw.length > 0) {
      //   for (let idx = 0; idx < formattedPackDraw.length; idx++) {
      //     const element = formattedPackDraw[idx];

      //     const totalBetAmount = await calculateTotalAmount([element]);
      //     await PacksSpendModel.findOneAndUpdate(
      //       {
      //         packsId: element._id,
      //       },
      //       { $inc: { totalSpends: totalBetAmount } }
      //     );

      //     const updatedSpendData = await PacksSpendModel.findOne({
      //       packsId: element._id,
      //     });
      //     const rareMultiPlayerAmount =
      //       element.packAmount * element.rareMultiPlayer || 10;
      //     const epicMultiPlayerAmount =
      //       element.packAmount * element.epicMultiPlayer || 20;

      //     // Rare Reward Found!
      //     if (updatedSpendData.totalSpends >= rareMultiPlayerAmount) {
      //       if (updatedSpendData.isRareReached) {
      //         // 2 Common 1 Rare
      //         const rewards = await rewardScript(
      //           "Two-Common-One-Rare",
      //           element
      //         );
      //         continue;
      //       } else {
      //         // 2 Rare 1 Common
      //         const rewards = await rewardScript(
      //           "Two-Rare-One-Common",
      //           element
      //         );
      //         continue;
      //       }
      //     }

      //     // Epic Reward Found!
      //     if (updatedSpendData.totalSpends >= epicMultiPlayerAmount) {
      //       if (updatedSpendData.isEpicReached) {
      //         // 2 Epic 1 Rare
      //         const rewards = await rewardScript("Two-Epic-One-Rare", element);

      //         // Reset
      //         await PacksSpendModel.findOneAndUpdate(
      //           {
      //             packsId: element._id,
      //           },
      //           {
      //             $set: {
      //               totalSpends: 0,
      //               isRareReached: false,
      //               isEpicReached: false,
      //             },
      //           }
      //         );
      //         continue;
      //       } else {
      //         // 2 Rare 1 Epic
      //         const rewards = await rewardScript("Two-Rare-One-Epic", element);
      //         continue;
      //       }
      //     }

      //     // Common Reward Found
      //     if (
      //       updatedSpendData.totalSpends < rareMultiPlayerAmount &&
      //       updatedSpendData.totalSpends < epicMultiPlayerAmount
      //     ) {
      //       // 3 Common
      //       const rewards = await rewardScript("common-only", element);
      //       continue;
      //     }
      //   }
      // }

      if (formattedPackDraw.length > 0) {
        for (let idx = 0; idx < formattedPackDraw.length; idx++) {
          const element = formattedPackDraw[idx];

          const totalBetAmount = await calculateTotalAmount([element]);
          await PacksSpendModel.findOneAndUpdate(
            { packsId: element._id },
            { $inc: { totalSpends: totalBetAmount } }
          );

          const updatedSpendData = await PacksSpendModel.findOne({
            packsId: element._id,
          });

          const rareMultiPlayerAmount =
            element.packAmount * element.rareMultiPlayer || 10;
          const epicMultiPlayerAmount =
            element.packAmount * element.epicMultiPlayer || 20;

          let rewards = [];

          // Rare Reward
          if (updatedSpendData.totalSpends >= rareMultiPlayerAmount) {
            if (updatedSpendData.isRareReached) {
              rewards = await rewardScript("Two-Common-One-Rare", element);
            } else {
              rewards = await rewardScript("Two-Rare-One-Common", element);
            }
          } else if (updatedSpendData.totalSpends >= epicMultiPlayerAmount) {
            // Epic Reward
            if (updatedSpendData.isEpicReached) {
              rewards = await rewardScript("Two-Epic-One-Rare", element);
              await PacksSpendModel.findOneAndUpdate(
                { packsId: element._id },
                {
                  $set: {
                    totalSpends: 0,
                    isRareReached: false,
                    isEpicReached: false,
                  },
                }
              );
            } else {
              rewards = await rewardScript("Two-Rare-One-Epic", element);
            }
          } else {
            // Common Reward
            rewards = await rewardScript("common-only", element);
          }
          if (rewards?.length > 0) {
            const winningId = getOneRandomId(rewards);
            allRewardIds.push({ [element._id]: winningId });
          }
        }
      }
      return {
        code: 200,
        status: true,
        message: "Reward IDs Fetched Successfully",
        data: allRewardIds,
      };
    } catch (error) {
      console.error("getRewardIds error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  spinPacks = async (userId, req_Body) => {
    try {
      const { packsIds, itemIds } = req_Body;
      console.log({ packsIds });
      const userDet = await UsersModel.findOne({ _id: userId });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User Not Found",
          data: null,
        };
      }
      const packsDet = await PackDrawModel.find({
        _id: { $in: packsIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .populate({
          path: "items",
          model: "PacksItems",
        })
        .populate("wallpaper");
      const actualPacksDet = packsIds.flatMap((id) => {
        const found = packsDet.find((d) => d._id.toString() === id.toString());
        return found ? [found] : [];
      });
      if (actualPacksDet.length <= 0) {
        return {
          code: 403,
          status: false,
          message: "Packs Not Found",
          data: null,
        };
      }
      const rewardItems = await PacksItemModel.find({
        _id: { $in: itemIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });

      if (rewardItems.length > 0) {
        const userBalance = await getUserBalance(userId);
        const totalAmount = await calculateTotalAmount(actualPacksDet);

        const actualRewardDet = itemIds.flatMap((id) => {
          const found = rewardItems.find(
            (d) => d._id.toString() === id.toString()
          );
          return found ? [found] : [];
        });
        const totalRewardAmount = await calculateTotalRewardAmount(
          actualRewardDet
        );
        console.log({ totalRewardAmount }, { totalAmount });
        if (userBalance.total_chip_amount >= totalAmount) {
          const isDeducted = await deductAmount(userId, totalAmount);
          // const isCredited = await creditAmount(userId, totalRewardAmount);

          let array = [];
          for (let idx = 0; idx < actualPacksDet.length; idx++) {
            const element = actualPacksDet[idx];
            array.push({
              userId: userId,
              packsId: element._id,
              spinAmount: element.packAmount,
              rewardItemId: actualRewardDet[idx]._id,
              rewardAmount: actualRewardDet[idx].amount,
            });
          }

          // const spinHistory = await SpinHistoryModel.create({
          //   userId: userId,
          //   packsId: JSON.stringify(
          //     actualPacksDet.map((item) => item._id.toString())
          //   ),
          //   spinAmount: totalAmount,
          //   rewardItemId: JSON.stringify(
          //     actualRewardDet.map((item) => item._id.toString())
          //   ),
          //   rewardAmount: totalRewardAmount,
          // });
          const spinHistory = await SpinHistoryModel.insertMany(array);
          if (isDeducted) {
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
      } else {
        return {
          code: 403,
          status: false,
          message: "Reward Item is not found",
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
          path: "items",
          model: "PacksItems",
        })
        .populate("wallpaper");
      const formattedData = data.map((pack) => ({
        _id: pack._id,
        name: pack.name,
        wallpaper: pack.wallpaper,
        packAmount: pack.packAmount,
        creator: pack.creator,
        packsItemDet: pack.items,
      }));

      const reFormattedData = packsId.flatMap((id) => {
        const found = formattedData.find(
          (d) => d._id.toString() === id.toString()
        );
        return found ? [found] : [];
      });
      console.log({ reFormattedData: reFormattedData.length });
      return {
        code: 200,
        status: true,
        message: "Get One Packs Details Retrieved",
        data: reFormattedData || [],
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
      if (
        !req_Body.items ||
        !Array.isArray(req_Body.items) ||
        req_Body.items.length === 0
      ) {
        return {
          code: 400,
          status: false,
          message: "At least one item is required!",
          data: null,
        };
      }

      const idsArray = req_Body.items.flatMap((item) =>
        Array(item.qty).fill(item.id)
      );
      if (idsArray.length === 0) {
        return {
          code: 400,
          status: false,
          message: "Valid items are required!",
          data: null,
        };
      }
      // Create the pack
      await PackDrawModel.create({
        name: req_Body.name,
        packAmount: req_Body.packAmount,
        wallpaper: req_Body.wallpaper._id,
        creator: "User",
        creatorId: req.userId,
        outCome: req_Body.outCome,
        items: idsArray,
      });

      return {
        code: 200,
        status: true,
        message: "Pack Created Successfully",
      };
    } catch (error) {
      console.log({ createPacks: error });

      // Handle specific MongoDB errors
      if (error.name === "ValidationError") {
        return {
          code: 400,
          status: false,
          message: "Validation Error: " + error.message,
          data: null,
        };
      }

      if (error.name === "CastError") {
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
  getPacksHistory = async (req, req_Query) => {
    try {
      const { userId } = req;
      const limit = parseInt(req_Query.limit) || 10;
      const page = parseInt(req_Query.page) || 1;

      const userHistory = await SpinHistoryModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $addFields: {
            packsArray: {
              $cond: {
                if: {
                  $eq: [{ $type: "$packsId" }, "string"],
                },
                then: {
                  $map: {
                    input: {
                      $filter: {
                        input: {
                          $split: [
                            {
                              $trim: {
                                input: "$packsId",
                                chars: '[]"',
                              },
                            },
                            ",",
                          ],
                        },
                        as: "val",
                        cond: {
                          $ne: [
                            {
                              $trim: {
                                input: "$$val",
                                chars: ' "',
                              },
                            },
                            "",
                          ],
                        },
                      },
                    },
                    as: "id",
                    in: {
                      $toObjectId: {
                        $trim: {
                          input: "$$id",
                          chars: ' "',
                        },
                      },
                    },
                  },
                },
                else: {
                  $cond: {
                    if: {
                      $eq: [{ $type: "$packsId" }, "objectId"],
                    },
                    then: ["$packsId"],
                    else: "$packsId",
                  },
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: "$packsArray",
          },
        },
        {
          $lookup: {
            from: "PackDraw",
            localField: "packsArray",
            foreignField: "_id",
            as: "PacksDet",
          },
        },
      ]);
      return {
        code: 200,
        status: true,
        message: "User Packs History",
        data: userHistory || [],
      };
    } catch (error) {
      console.error({ getPacksHistory: error });
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
