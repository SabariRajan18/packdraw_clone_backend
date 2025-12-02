import RedisManager from "../config/redis.js";
import battleService from "../services/userService/battleService.js";

class BattleHandler {
  constructor(io) {
    this.io = io;
    this.activeBattles = new Map(); // Track currently running battles
  }

  initialize() {
    this.io.on("connection", (socket) => {
      console.log("🟢 User connected:", socket.id);

      // Battle room management
      socket.on("join-battle-room", async (data) => {
        await this.handleJoinBattleRoom(socket, data);
      });

      socket.on("leave-battle-room", async (data) => {
        await this.handleLeaveBattleRoom(socket, data);
      });

      socket.on("join-battle", async (data) => {
        await this.handleJoinBattle(socket, data);
      });

      socket.on("start-battle", async (data) => {
        await this.handleStartAutomatedBattle(socket, data);
      });

      socket.on("disconnect", async () => {
        await this.handleDisconnect(socket);
      });
      socket.on("register", async (data) => {
        await this.handleUserRegistration(socket, data);
      });

      socket.on("battle-ready", async (data) => {
        await this.handlePlayerReady(socket, data);
      });

      socket.on("get-battle-info", async (data) => {
        await this.handleGetBattleInfo(socket, data);
      });

      socket.on("create-battle", async (data) => {
        await this.handleCreateBattle(socket, data);
      });
    });
  }
  async handleUserRegistration(socket, data) {
    try {
      const { userId } = data;
      socket.userId = userId; // Attach userId to socket
      console.log(`🟡 User ${userId} registered with socket ${socket.id}`);
    } catch (error) {
      console.error("User registration error:", error);
    }
  }
  async checkBattleCanStart(battleId) {
    try {
      const battle = await Battles.findById(battleId);

      // Check if battle has minimum players and all are ready
      const allPlayersReady = battle.players.every((player) => player.ready);
      const hasMinPlayers = battle.players.length >= battle.settings.minPlayers;

      if (allPlayersReady && hasMinPlayers) {
        // Auto-start battle after 5 seconds
        setTimeout(() => {
          this.io.to(`battle:${battleId}`).emit("battle-auto-starting", {
            countdown: 5,
            message: "All players ready! Starting battle...",
          });

          // Start battle after countdown
          setTimeout(() => {
            this.handleStartAutomatedBattle({ id: battleId }); // Trigger start
          }, 5000);
        }, 1000);
      }
    } catch (error) {
      console.error("Check battle start error:", error);
    }
  }
  async handlePlayerReady(socket, data) {
    try {
      const { battleId, ready } = data;

      // Update player ready status in database
      await battleService.updatePlayerReady(battleId, socket.userId, ready);

      // Broadcast to all in battle room
      this.io.to(`battle:${battleId}`).emit("player-ready-update", {
        userId: socket.userId,
        ready: ready,
        battleId: battleId,
      });

      // Check if all players ready and battle can start
      await this.checkBattleCanStart(battleId);
    } catch (error) {
      console.error("Player ready error:", error);
    }
  }
  async handleGetBattleInfo(socket, data) {
    try {
      const { battleId } = data;
      const result = await battleService.getBattleInfo(battleId);

      socket.emit("battle-info-response", {
        battleId,
        data: result.data,
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to get battle info" });
    }
  }
  async handleCreateBattle(socket, data) {
    try {
      const battleData = {
        ...data,
        creatorId: socket.userId,
        status: "waiting", // IMPORTANT: Start as waiting
      };

      const result = await battleService.createBattle(battleData);

      if (result.success) {
        // AUTO-JOIN BATTLE ROOM AFTER CREATION
        await this.handleJoinBattleRoom(socket, {
          battleId: result.data._id,
          userId: socket.userId,
        });

        // AUTO-JOIN BATTLE (API)
        await this.handleJoinBattle(socket, {
          battleId: result.data._id,
          userId: socket.userId,
        });

        socket.emit("battle-created", {
          battle: result.data,
          message: "Battle created! Waiting for players...",
        });

        // Update battles list for everyone
        this.emitAllBattlesUpdate();
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to create battle" });
    }
  }
  // Join battle room
  async handleJoinBattleRoom(socket, data) {
    try {
      const { battleId, userId } = data;

      await socket.join(`battle:${battleId}`);

      // Store in Redis
      await RedisManager.addToBattleRoom(battleId, socket.id, {
        userId,
        socketId: socket.id,
        joinedAt: new Date(),
      });

      // Notify others
      socket.to(`battle:${battleId}`).emit("player-joined", {
        userId,
        socketId: socket.id,
        message: "Player joined the battle",
      });

      console.log(`🟢 User ${userId} joined battle room: ${battleId}`);
    } catch (error) {
      socket.emit("error", { message: "Failed to join battle room" });
      console.error("Join battle room error:", error);
    }
  }

  // Leave battle room
  async handleLeaveBattleRoom(socket, data) {
    try {
      const { battleId, userId } = data;

      await socket.leave(`battle:${battleId}`);
      await RedisManager.removeFromBattleRoom(battleId, socket.id, userId);

      socket.to(`battle:${battleId}`).emit("player-left", {
        userId,
        message: "Player left the battle",
      });

      console.log(`🔴 User ${userId} left battle room: ${battleId}`);
    } catch (error) {
      console.error("Leave battle room error:", error);
    }
  }

  // Join battle (API + Socket)
  async handleJoinBattle(socket, data) {
    try {
      const { battleId, userId } = data;

      const result = await battleService.joinBattle(battleId, {
        userId,
        username: "User", // Get from user service
        avatar: "",
      });

      if (result.success) {
        // Join socket room
        await this.handleJoinBattleRoom(socket, { battleId, userId });

        // Notify all players in the battle
        this.io.to(`battle:${battleId}`).emit("battle-updated", {
          type: "player_joined",
          battle: result.data,
          playerId: userId,
        });

        // Update all battles list
        this.emitAllBattlesUpdate();

        socket.emit("battle-join-res", {
          type: "success",
          id: battleId,
          msg: "Successfully joined battle",
        });
      } else {
        socket.emit("battle-join-res", {
          type: "error",
          msg: result.message,
        });
      }
    } catch (error) {
      socket.emit("battle-join-res", {
        type: "error",
        msg: "Failed to join battle",
      });
      console.error("Join battle error:", error);
    }
  }

  // START AUTOMATED BATTLE (MAIN FUNCTION)
  async handleStartAutomatedBattle(socket, data) {
    try {
      const { battleId } = data;

      console.log(`🎮 Starting automated battle: ${battleId}`);

      // Prevent multiple starts
      if (this.activeBattles.has(battleId)) {
        socket.emit("error", { message: "Battle already running" });
        return;
      }

      this.activeBattles.set(battleId, true);

      // Start battle via service
      const result = await battleService.startAutomatedBattle(battleId);

      if (result.success) {
        // Notify all players battle is starting
        this.io.to(`battle:${battleId}`).emit("battle-started", {
          battle: result.data,
          countdown: 3,
        });

        // AUTOMATED COUNTDOWN (3...2...1...)
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          this.io.to(`battle:${battleId}`).emit("countdown-update", {
            countdown,
          });

          if (countdown === 0) {
            clearInterval(countdownInterval);

            // Start AUTOMATED battle
            this.io.to(`battle:${battleId}`).emit("battle-active", {
              message: "Battle started! Opening packs automatically...",
            });

            // RUN COMPLETE AUTOMATED BATTLE
            this.runCompleteAutomatedBattle(battleId);
          }
          countdown--;
        }, 1000);
      } else {
        this.activeBattles.delete(battleId);
        socket.emit("error", { message: result.message });
      }
    } catch (error) {
      this.activeBattles.delete(battleId);
      socket.emit("error", { message: "Failed to start battle" });
      console.error("Start battle error:", error);
    }
  }

  // RUN COMPLETE AUTOMATED BATTLE
  async runCompleteAutomatedBattle(battleId) {
    try {
      console.log(`🚀 Running automated battle: ${battleId}`);

      const battleInfo = await battleService.getBattleInfo(battleId);
      const battle = battleInfo.data[0];

      // Run all rounds automatically
      for (let round = 1; round <= battle.rounds; round++) {
        console.log(`🔄 Starting round ${round} of ${battle.rounds}`);

        // Notify round start
        this.io.to(`battle:${battleId}`).emit("round-started", {
          round,
          totalRounds: battle.rounds,
        });

        // Open ALL packs for ALL players in this round
        const roundResults = await battleService.openAllPacksForRoundEnhanced(
          battleId,
          round
        );

        // Broadcast each pack opening with delays for animation
        for (const packResult of roundResults.packResults) {
          this.io.to(`battle:${battleId}`).emit("pack-opened", {
            userId: packResult.userId,
            username: packResult.username,
            round: packResult.round,
            packIndex: packResult.packIndex,
            items: packResult.items,
            totalValue: packResult.totalValue,
            playerStats: roundResults.playerStats,
            battleMode: roundResults.battleMode,
          });

          // Delay for visual effect between packs
          await this.delay(800);
        }

        // Notify round completion
        this.io.to(`battle:${battleId}`).emit("round-completed", {
          round,
          totalRounds: battle.rounds,
          playerStats: roundResults.playerStats,
        });

        console.log(`✅ Round ${round} completed`);

        // Delay between rounds (except last round)
        if (round < battle.rounds) {
          await this.delay(2000);
        }
      }

      // Complete battle and determine winner
      console.log(`🎯 Calculating winner for battle: ${battleId}`);
      const winnerResult = await battleService.completeBattle(battleId);

      // Broadcast final results
      this.io.to(`battle:${battleId}`).emit("battle-completed", {
        winner: winnerResult.data.winner,
        prizeDistribution: winnerResult.data.prizeDistribution,
        totalPrize: winnerResult.data.totalPrize,
        isShared: winnerResult.data.isShared,
        jackpotPool: winnerResult.data.jackpotPool,
        winnerPrize: winnerResult.data.winnerPrize,
      });

      console.log(
        `🏆 Battle ${battleId} completed! Winner: ${winnerResult.data.winner}`
      );

      // Update all battles list
      this.emitAllBattlesUpdate();

      // Cleanup
      this.activeBattles.delete(battleId);
      await this.cleanupBattleRoom(battleId);
    } catch (error) {
      console.error("❌ Automated battle failed:", error);
      this.io.to(`battle:${battleId}`).emit("error", {
        message: "Battle failed to complete",
      });
      this.activeBattles.delete(battleId);
    }
  }

  // Cleanup battle room
  async cleanupBattleRoom(battleId) {
    try {
      const roomUsers = await RedisManager.getBattleRoomUsers(battleId);
      for (const [socketId, userData] of Object.entries(roomUsers)) {
        await RedisManager.removeFromBattleRoom(
          battleId,
          socketId,
          userData.userId
        );
      }
      console.log(`🧹 Cleaned up battle room: ${battleId}`);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  // Update all battles list for everyone
  async emitAllBattlesUpdate() {
    try {
      const battles = await battleService.getAllBattles({ limit: 50 });
      this.io.emit("all-battles", battles.data.battles);
    } catch (error) {
      console.error("Emit battles update error:", error);
    }
  }

  // Handle disconnect
  async handleDisconnect(socket) {
    try {
      // Get user's battle from Redis
      const userBattle = await RedisManager.getUserBattle(socket.userId);

      if (userBattle) {
        await this.handleLeaveBattleRoom(socket, {
          battleId: userBattle.battleId,
          userId: socket.userId,
        });
      }

      console.log("🔴 User disconnected:", socket.id);
    } catch (error) {
      console.error("Disconnect handler error:", error);
    }
  }

  // Helper method
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default BattleHandler;
