import Battles from "../../models/Battles.js";
import BattleSession from "../../models/BattleSession.js";
import PackDraw from "../../models/PackDraw.js";
import Users from "../../models/Users.js";
import PacksItems from "../../models/PacksItems.js";
import { calculateWinner, calculateChances } from "../../utils/gameLogic.js";
import botService from "./botService.js";
import packService from "./packService.js";
import matchmakingService from "./matchmakingService.js";

class BattleService {
  // Create new battle
  async createBattle(battleData) {
    try {
      const battle = new Battles(battleData);

      // AUTO-ADD CREATOR AS PLAYER
      const creatorUser = await Users.findById(battleData.creatorId);
      battle.players.push({
        userId: battleData.creatorId,
        username: creatorUser.userName||"mrmtouser",
        avatar: creatorUser.profileImage,
        ready: false,
        isCreator: true,
      });

      await battle.save();
      return { success: true, data: battle };
    } catch (error) {
      throw error;
    }
  }

  // Get all battles with filters
  async getAllBattles(filters = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        sortBy = "createdAt",
        sortOrder = "desc",
        battleType = "",
        status = "",
        players = "",
        search = "",
      } = filters;

      const query = {};

      if (battleType) query.battleType = battleType;
      if (status) query.status = status;
      if (players) query["settings.maxPlayers"] = parseInt(players);
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { battleGameMode: { $regex: search, $options: "i" } },
        ];
      }

      const battles = await Battles.find(query)
        .populate("packsIds", "name wallpaper packAmount")
        .populate("players.userId", "username profileImage")
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Battles.countDocuments(query);

      return {
        success: true,
        data: {
          battles,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        },
      };
    } catch (error) {
      throw new Error(`Get battles failed: ${error.message}`);
    }
  }

  // Join battle
  async joinBattle(battleId, userData) {
    try {
      const battle = await Battles.findById(battleId);
      if (!battle) {
        return { success: false, message: "Battle not found" };
      }

      if (battle.status !== "waiting") {
        return { success: false, message: "Battle already started" };
      }

      if (battle.players.length >= battle.settings.maxPlayers) {
        return { success: false, message: "Battle is full" };
      }

      // Check if user already joined
      const alreadyJoined = battle.players.some(
        (player) => player.userId.toString() === userData.userId.toString()
      );
      if (alreadyJoined) {
        return { success: false, message: "Already joined this battle" };
      }

      // Add player to battle
      battle.players.push({
        userId: userData.userId,
        username: userData.username,
        avatar: userData.avatar,
        ready: false,
      });

      await battle.save();

      // Update battle session
      await BattleSession.findOneAndUpdate(
        { battleId },
        {
          $push: {
            playerStats: {
              userId: userData.userId,
              username: userData.username,
              totalValue: 0,
              points: 0,
              lastPackValue: 0,
              chances: 0,
              color: this.getRandomColor(),
            },
          },
        }
      );

      return {
        success: true,
        message: "Joined battle successfully",
        data: battle,
      };
    } catch (error) {
      throw new Error(`Join battle failed: ${error.message}`);
    }
  }

  // Get battle info
  async getBattleInfo(battleId) {
    try {
      const battle = await Battles.findById(battleId)
        .populate("packsIds")
        .populate("players.userId", "username profileImage")
        .populate("creatorId", "username");

      if (!battle) {
        return { success: false, message: "Battle not found" };
      }

      const session = await BattleSession.findOne({ battleId });

      return {
        success: true,
        data: [
          {
            ...battle.toObject(),
            session: session || {},
          },
        ],
      };
    } catch (error) {
      throw new Error(`Get battle info failed: ${error.message}`);
    }
  }
  async createOrJoinBattle(battleData) {
    try {
      // If user wants quick match, use matchmaking
      if (battleData.quickMatch) {
        return await matchmakingService.addToQueue(
          {
            userId: battleData.creatorId,
            username: battleData.username,
            avatar: battleData.avatar,
          },
          battleData.battleGameMode,
          battleData.battleType
        );
      }

      // Otherwise create custom battle
      return await this.createBattle(battleData);
    } catch (error) {
      throw new Error(`Create/join battle failed: ${error.message}`);
    }
  }

  // Enhanced automated battle with bots and real pack opening
  async runCompleteAutomatedBattle(battleId) {
    try {
      console.log(`🚀 Starting enhanced automated battle: ${battleId}`);

      const battle = await Battles.findById(battleId);
      const session = await BattleSession.findOne({ battleId });

      if (!battle || !session) {
        throw new Error("Battle or session not found");
      }

      // Update status to active
      battle.status = "active";
      battle.currentRound = 1;
      await battle.save();

      // Run all rounds automatically
      for (let round = 1; round <= battle.rounds; round++) {
        console.log(`🔄 Starting round ${round} of ${battle.rounds}`);

        // Open ALL packs for ALL players (real users + bots)
        const roundResults = await this.openAllPacksForRoundEnhanced(
          battleId,
          round
        );

        console.log(`✅ Round ${round} completed`);

        // Delay between rounds
        if (round < battle.rounds) {
          await this.delay(2000);
          battle.currentRound = round + 1;
          await battle.save();
        }
      }

      // Complete battle and determine winner
      console.log(`🎯 Calculating winner for battle: ${battleId}`);
      const winnerResult = await this.completeBattle(battleId);

      return {
        success: true,
        data: winnerResult.data,
      };
    } catch (error) {
      console.error("❌ Enhanced automated battle failed:", error);
      throw new Error(`Enhanced automated battle failed: ${error.message}`);
    }
  }

  // Enhanced pack opening with real probability system and bots
  async openAllPacksForRoundEnhanced(battleId, round) {
    try {
      const battle = await Battles.findById(battleId);
      const session = await BattleSession.findOne({ battleId });

      const allPackResults = [];

      // For each player in battle (real users + bots)
      for (const player of battle.players) {
        // For each pack per player
        for (
          let packIndex = 0;
          packIndex < battle.packsPerPlayer;
          packIndex++
        ) {
          let packResult;

          if (player.isBot) {
            // Use bot service for bot players
            packResult = await botService.simulateBotPackOpening(
              battle.packsIds[packIndex],
              player.botDifficulty,
              battle.battleGameMode
            );
          } else {
            // Use real pack service for human players
            packResult = await packService.openPackWithProbability(
              battle.packsIds[packIndex],
              player.userId
            );
          }

          // Store pack result
          const packOpening = {
            userId: player.userId,
            username: player.username,
            round: round,
            packIndex: packIndex,
            items: packResult.items,
            totalValue: packResult.totalValue,
            openedAt: new Date(),
            isBot: player.isBot || false,
          };

          // Add to session
          session.packOpenings.push(packOpening);

          // Update player stats
          const playerStat = session.playerStats.find(
            (stat) => stat.userId.toString() === player.userId.toString()
          );

          if (playerStat) {
            playerStat.totalValue += packResult.totalValue;
            playerStat.lastPackValue = packResult.totalValue;

            // For Point Rush mode
            if (battle.battleGameMode === "pointRush") {
              await this.calculatePointRushPoints(
                battle,
                session,
                round,
                player.userId,
                packResult.totalValue
              );
            }
          }

          allPackResults.push({
            ...packOpening,
            playerStats: JSON.parse(JSON.stringify(session.playerStats)),
          });

          // Delay for animation
          await this.delay(800);
        }
      }

      // Update chances
      const updatedStats = calculateChances(
        session.playerStats,
        battle.battleOptions
      );
      session.playerStats = updatedStats;

      await session.save();

      return {
        round,
        packResults: allPackResults,
        playerStats: session.playerStats,
        battleMode: battle.battleGameMode,
      };
    } catch (error) {
      throw new Error(`Enhanced round pack opening failed: ${error.message}`);
    }
  }

  // Start automated battle
  async startAutomatedBattle(battleId) {
    try {
      const battle = await Battles.findById(battleId);
      if (!battle) {
        return { success: false, message: "Battle not found" };
      }

      if (battle.status !== "waiting") {
        return { success: false, message: "Battle already started" };
      }

      // Update battle status
      battle.status = "countdown";
      battle.startedAt = new Date();
      await battle.save();

      return {
        success: true,
        message: "Battle starting automatically...",
        data: battle,
      };
    } catch (error) {
      throw new Error(`Start battle failed: ${error.message}`);
    }
  }

  // Open ALL packs for ALL players in a round
  async openAllPacksForRound(battleId, round) {
    try {
      const battle = await Battles.findById(battleId);
      const session = await BattleSession.findOne({ battleId });

      const allPackResults = [];

      // For each player in battle
      for (const player of battle.players) {
        // For each pack per player
        for (
          let packIndex = 0;
          packIndex < battle.packsPerPlayer;
          packIndex++
        ) {
          // Simulate pack opening
          const packResult = await this.simulateRealPackOpening(
            battle.packsIds[packIndex],
            player.userId
          );

          // Store pack result
          const packOpening = {
            userId: player.userId,
            username: player.username,
            round: round,
            packIndex: packIndex,
            items: packResult.items,
            totalValue: packResult.totalValue,
            openedAt: new Date(),
          };

          // Add to session
          session.packOpenings.push(packOpening);

          // Update player stats
          const playerStat = session.playerStats.find(
            (stat) => stat.userId.toString() === player.userId.toString()
          );

          if (playerStat) {
            playerStat.totalValue += packResult.totalValue;
            playerStat.lastPackValue = packResult.totalValue;

            // For Point Rush mode - calculate points
            if (battle.battleGameMode === "pointRush") {
              await this.calculatePointRushPoints(
                battle,
                session,
                round,
                player.userId,
                packResult.totalValue
              );
            }
          }

          allPackResults.push({
            ...packOpening,
            playerStats: JSON.parse(JSON.stringify(session.playerStats)), // Deep copy
          });

          // Small delay between packs for animation
          await this.delay(800);
        }
      }

      // Update chances based on current game mode
      const updatedStats = calculateChances(
        session.playerStats,
        battle.battleOptions
      );
      session.playerStats = updatedStats;

      await session.save();

      return {
        round,
        packResults: allPackResults,
        playerStats: session.playerStats,
        battleMode: battle.battleGameMode,
      };
    } catch (error) {
      throw new Error(`Round pack opening failed: ${error.message}`);
    }
  }

  // Simulate REAL pack opening with actual items
  async simulateRealPackOpening(packId, userId) {
    try {
      // Get pack details
      const pack = await PackDraw.findById(packId).populate("items");
      if (!pack) {
        throw new Error("Pack not found");
      }

      // Get user info
      const user = await Users.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Select random items from pack (simplified - you can make this more complex)
      const selectedItems = [];
      let totalValue = 0;

      // Select 1-3 random items from the pack
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        const randomItem =
          pack.items[Math.floor(Math.random() * pack.items.length)];
        if (randomItem) {
          const itemValue = this.calculateItemValue(randomItem, pack);
          selectedItems.push({
            itemId: randomItem._id,
            name: randomItem.name,
            value: itemValue,
            rarity: randomItem.rarity || "common",
            image: randomItem.image || "default-item.jpg",
          });
          totalValue += itemValue;
        }
      }

      return {
        username: user.username,
        items: selectedItems,
        totalValue: totalValue,
        packName: pack.name,
      };
    } catch (error) {
      console.error("Pack opening simulation failed:", error);
      // Return default items if simulation fails
      return {
        username: "Player",
        items: [
          {
            name: "Default Item",
            value: 10,
            rarity: "common",
            image: "default-item.jpg",
          },
        ],
        totalValue: 10,
        packName: "Default Pack",
      };
    }
  }

  // Calculate item value with multipliers
  calculateItemValue(item, pack) {
    let baseValue = item.value || 10;

    // Apply rarity multipliers
    if (item.rarity === "rare") {
      baseValue *= pack.rareMultiPlayer || 10;
    } else if (item.rarity === "epic") {
      baseValue *= pack.epicMultiPlayer || 20;
    }

    return baseValue;
  }

  // Calculate points for Point Rush mode
  async calculatePointRushPoints(battle, session, round, userId, packValue) {
    try {
      // Find all pack values for this round
      const roundPacks = session.packOpenings.filter(
        (opening) => opening.round === round
      );

      // Find minimum value in this round
      const minValue = Math.min(...roundPacks.map((pack) => pack.totalValue));

      // If this player has the minimum value, award point
      if (packValue === minValue) {
        const playerStat = session.playerStats.find(
          (stat) => stat.userId.toString() === userId.toString()
        );
        if (playerStat) {
          playerStat.points += 1;
        }
      }
    } catch (error) {
      console.error("Point calculation failed:", error);
    }
  }

  // Complete battle and determine winner
  async completeBattle(battleId) {
    try {
      const battle = await Battles.findById(battleId);
      const session = await BattleSession.findOne({ battleId });

      if (!battle || !session) {
        return { success: false, message: "Battle not found" };
      }

      // Calculate winner based on game mode
      const winnerResult = calculateWinner(battle, session);

      // Update battle with results
      battle.status = "completed";
      battle.completedAt = new Date();
      battle.results = winnerResult;
      battle.unboxedAmount = winnerResult.totalPrize;

      await battle.save();

      // Mark session as completed
      session.isCompleted = true;
      await session.save();

      return {
        success: true,
        data: {
          winner: winnerResult.winner,
          prizeDistribution: winnerResult.prizeDistribution,
          totalPrize: winnerResult.totalPrize,
          isShared: winnerResult.isShared || false,
          jackpotPool: winnerResult.jackpotPool,
          winnerPrize: winnerResult.winnerPrize,
        },
      };
    } catch (error) {
      throw new Error(`Complete battle failed: ${error.message}`);
    }
  }

  // Get user's battles
  async getUserBattles(userId, filters = {}) {
    try {
      const { page = 1, limit = 10, status = "" } = filters;

      const query = {
        $or: [{ "players.userId": userId }, { creatorId: userId }],
      };

      if (status) query.status = status;

      const battles = await Battles.find(query)
        .populate("packsIds", "name wallpaper packAmount")
        .populate("players.userId", "username profileImage")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Battles.countDocuments(query);

      return {
        success: true,
        data: {
          battles,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        },
      };
    } catch (error) {
      throw new Error(`Get user battles failed: ${error.message}`);
    }
  }

  // Helper methods
  getRandomColor() {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new BattleService();
