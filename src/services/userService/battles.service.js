import mongoose from "mongoose";
import BattleConfig from "../../config/battles.json" with { type: "json" };
import { calculateTotalAmount, deductAmount, getUserBalance } from "../../helpers/common.helper.js";
class UserBattlesService {
  createBattle = async (userId, req_Body) => {
    try {
      const { name, battleType, players, battleGameMode, packsIds } = req_Body;
      console.log("req_Body:", players);

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
      console.log("selectedBattle.players:", selectedBattle.players);
      if (!selectedBattle.players.includes(players.toString())) {
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
  getBattleInfo = async (req_Body,battleId) => {
    try {
      // const {    } = req_Body;
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
  // Add these methods to your UserBattlesService class

  getAllBattles = async (userId, filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        battleType,
        status,
        players,
        search
      } = filters;
  
      const skip = (page - 1) * limit;
  
      // Build match query
      const matchQuery = {};
      
      if (battleType) {
        matchQuery.battleType = battleType;
      }
      
      if (status) {
        matchQuery.status = status;
      }
      
      if (players) {
        matchQuery.players = players;
      }
  
      if (search) {
        matchQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { battleGameMode: { $regex: search, $options: 'i' } }
        ];
      }
  
      const aggregationPipeline = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "users",
            localField: "creatorId",
            foreignField: "_id",
            as: "creatorInfo",
          }
        },
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "BattleHistory",
            localField: "_id",
            foreignField: "battleId",
            as: "participants",
          }
        },
        {
          $lookup: {
            from: "PackDraw",
            localField: "packsIds",
            foreignField: "_id",
            as: "packsInfo",
            pipeline: [
              {
                $lookup: {
                  from: "PacksImages",
                  localField: "wallpaper",
                  foreignField: "_id",
                  as: "wallpaperInfo"
                }
              },
              {
                $unwind: {
                  path: "$wallpaperInfo",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $addFields: {
                  // Add the wallpaper URL directly to the pack object
                  wallpaperUrl: "$wallpaperInfo.wallpaper"
                }
              },
              {
                $project: {
                  wallpaperInfo: 0 // Remove the nested wallpaperInfo object
                }
              }
            ]
          }
        },
        {
          $addFields: {
            participantsCount: { $size: "$participants" },
            playersNumber: {
              $cond: {
                if: { $regexMatch: { input: "$players", regex: /^[0-9]+$/ } },
                then: { $toInt: "$players" },
                else: 2
              }
            }
          }
        },
        {
          $addFields: {
            slotsAvailable: {
              $subtract: ["$playersNumber", "$participantsCount"]
            },
            totalPacks: { $size: "$packsIds" },
            creatorName: "$creatorInfo.username",
            isJoined: {
              $in: [new mongoose.Types.ObjectId(userId), "$participants.userId"]
            },
            isCreator: {
              $eq: ["$creatorId", new mongoose.Types.ObjectId(userId)]
            }
          }
        },
        {
          $project: {
            "creatorInfo.password": 0,
            "creatorInfo.email": 0,
            "participants.userId": 0,
            "playersNumber": 0
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        }
      ];
  
      // Get total count for pagination
      const countPipeline = [...aggregationPipeline.slice(0, -1)];
      countPipeline.push({ $count: "total" });
      
      const totalResult = await BattleModel.aggregate(countPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;
  
      // Get paginated data
      aggregationPipeline.push(
        { $skip: skip },
        { $limit: parseInt(limit) }
      );
  
      const battles = await BattleModel.aggregate(aggregationPipeline);
  
      return {
        code: 200,
        status: true,
        message: "Battles fetched successfully",
        data: {
          battles,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalBattles: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };
  
    } catch (error) {
      console.error("getAllBattles error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

getUserBattles = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type = 'all' // 'created', 'joined', 'all'
    } = filters;

    const skip = (page - 1) * limit;

    let matchQuery = {};

    if (type === 'created') {
      matchQuery.creatorId = new mongoose.Types.ObjectId(userId);
    } else if (type === 'joined') {
      // This would need to check BattleHistory for participation
      matchQuery = {
        "participants.userId": new mongoose.Types.ObjectId(userId)
      };
    } else {
      // All battles relevant to user (created or joined)
      matchQuery = {
        $or: [
          { creatorId: new mongoose.Types.ObjectId(userId) },
          { "participants.userId": new mongoose.Types.ObjectId(userId) }
        ]
      };
    }

    if (status) {
      matchQuery.status = status;
    }

    const aggregationPipeline = [
      {
        $lookup: {
          from: "BattleHistory",
          localField: "_id",
          foreignField: "battleId",
          as: "participants"
        }
      },
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "creatorId",
          foreignField: "_id",
          as: "creatorInfo",
        }
      },
      {
        $unwind: {
          path: "$creatorInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "PackDraw",
          localField: "packsIds",
          foreignField: "_id",
          as: "packsInfo",
        }
      },
      {
        $addFields: {
          participantsCount: { $size: "$participants" },
          slotsAvailable: {
            $subtract: [
              { $toInt: "$players" },
              { $size: "$participants" }
            ]
          },
          isCreator: {
            $eq: ["$creatorId", new mongoose.Types.ObjectId(userId)]
          },
          isJoined: {
            $in: [new mongoose.Types.ObjectId(userId), "$participants.userId"]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const total = await BattleModel.aggregate([
      ...aggregationPipeline,
      { $count: "total" }
    ]);

    aggregationPipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const battles = await BattleModel.aggregate(aggregationPipeline);

    return {
      code: 200,
      status: true,
      message: "User battles fetched successfully",
      data: {
        battles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total.length > 0 ? total[0].total : 0 / limit),
          totalBattles: total.length > 0 ? total[0].total : 0,
          hasNext: page * limit < (total.length > 0 ? total[0].total : 0),
          hasPrev: page > 1
        }
      }
    };

  } catch (error) {
    console.error("getUserBattles error:", error);
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
