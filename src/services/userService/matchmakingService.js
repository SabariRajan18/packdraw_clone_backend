
import Battles from '../../models/Battles.js';
import BattleSession from '../../models/BattleSession.js';
import botService from './botService.js';

class MatchmakingService {
  // Battle queues by game mode
  battleQueues = {
    normal: [],
    jackpot: [],
    pointRush: [],
    lastChance: [],
    shared: [],
    upsideDown: []
  };

  // Auto-battle configurations
  autoBattleConfigs = {
    normal: { minPlayers: 2, maxPlayers: 4, botFill: true },
    jackpot: { minPlayers: 3, maxPlayers: 6, botFill: true },
    pointRush: { minPlayers: 2, maxPlayers: 4, botFill: true },
    lastChance: { minPlayers: 2, maxPlayers: 4, botFill: true },
    shared: { minPlayers: 3, maxPlayers: 8, botFill: true },
    upsideDown: { minPlayers: 2, maxPlayers: 4, botFill: true }
  };

  // Add player to matchmaking queue
  async addToQueue(userData, gameMode, battleType = 'solo') {
    try {
      const queueItem = {
        userId: userData.userId,
        username: userData.username,
        avatar: userData.avatar,
        gameMode,
        battleType,
        joinedAt: new Date(),
        skillRating: userData.skillRating || 1000 // Default ELO
      };

      // Add to appropriate queue
      this.battleQueues[gameMode].push(queueItem);
      
      console.log(`🎯 Player ${userData.username} joined ${gameMode} queue`);

      // Try to create battle immediately
      await this.tryCreateBattle(gameMode);

      return { success: true, message: 'Added to queue' };
    } catch (error) {
      console.error('Add to queue error:', error);
      return { success: false, message: 'Queue error' };
    }
  }

  // Try to create battle from queue
  async tryCreateBattle(gameMode) {
    try {
      const queue = this.battleQueues[gameMode];
      const config = this.autoBattleConfigs[gameMode];

      if (queue.length >= config.minPlayers) {
        console.log(`🎮 Creating auto-battle for ${gameMode} with ${queue.length} players`);
        
        // Get players from queue
        const playersToBattle = queue.splice(0, config.maxPlayers);
        
        // Create battle
        await this.createAutoBattle(playersToBattle, gameMode, config);
      }
    } catch (error) {
      console.error('Try create battle error:', error);
    }
  }

  // Create automatic battle
  async createAutoBattle(players, gameMode, config) {
    try {
      // Calculate battle amount based on game mode
      const battleAmount = this.calculateBattleAmount(gameMode);
      
      // Create battle data
      const battleData = {
        creatorId: players[0].userId, // First player as creator
        creatorType: 'user',
        name: `Auto ${gameMode} Battle`,
        battleType: 'solo',
        battleGameMode: gameMode,
        battleAmount: battleAmount,
        players: players.map(player => ({
          userId: player.userId,
          username: player.username,
          avatar: player.avatar,
          ready: true
        })),
        packsPerPlayer: 1,
        packsIds: await this.getRandomPacks(2), // 2 random packs
        rounds: this.getRoundsByMode(gameMode),
        status: 'waiting',
        settings: {
          maxPlayers: config.maxPlayers,
          entryFee: battleAmount,
          prizePool: battleAmount * config.maxPlayers
        },
        battleOptions: {
          fastBattle: true
        }
      };

      // Add bots if needed
      if (config.botFill && players.length < config.maxPlayers) {
        const botsNeeded = config.maxPlayers - players.length;
        const bots = await botService.generateBots(null, botsNeeded, 'medium');
        battleData.players.push(...bots);
      }

      // Create battle in database
      const battle = new Battles(battleData);
      await battle.save();

      // Create battle session
      const session = new BattleSession({
        battleId: battle._id,
        playerStats: battle.players.map(player => ({
          userId: player.userId,
          username: player.username,
          totalValue: 0,
          points: 0,
          lastPackValue: 0,
          chances: 0,
          color: this.getRandomColor(),
          isBot: player.isBot || false
        }))
      });
      await session.save();

      console.log(`✅ Auto-battle created: ${battle._id} with ${battle.players.length} players`);

      // Notify players via socket (you'll need to implement this)
      this.notifyPlayersBattleReady(battle, players);

      return battle;
    } catch (error) {
      console.error('Create auto battle error:', error);
      // Return players to queue on error
      this.battleQueues[gameMode].unshift(...players);
      throw error;
    }
  }

  // Skill-based matchmaking
  async findSkillBasedMatch(userData, gameMode) {
    try {
      const queue = this.battleQueues[gameMode];
      const userSkill = userData.skillRating || 1000;
      
      // Find players within skill range (±200 points)
      const skillRange = 200;
      const suitableOpponents = queue.filter(player => 
        Math.abs(player.skillRating - userSkill) <= skillRange
      );

      if (suitableOpponents.length >= 1) { // Need at least 1 opponent + bots
        const opponents = suitableOpponents.slice(0, 3); // Max 3 real opponents
        const allPlayers = [userData, ...opponents];
        
        // Remove selected players from queue
        opponents.forEach(opponent => {
          const index = queue.findIndex(p => p.userId === opponent.userId);
          if (index > -1) queue.splice(index, 1);
        });

        return allPlayers;
      }

      return null;
    } catch (error) {
      console.error('Skill based matchmaking error:', error);
      return null;
    }
  }

  // Remove player from queue
  removeFromQueue(userId, gameMode) {
    const queue = this.battleQueues[gameMode];
    const index = queue.findIndex(player => player.userId === userId);
    
    if (index > -1) {
      queue.splice(index, 1);
      console.log(`❌ Player ${userId} removed from ${gameMode} queue`);
      return true;
    }
    
    return false;
  }

  // Get queue status
  getQueueStatus(gameMode) {
    const queue = this.battleQueues[gameMode];
    const config = this.autoBattleConfigs[gameMode];
    
    return {
      gameMode,
      playersInQueue: queue.length,
      playersNeeded: Math.max(0, config.minPlayers - queue.length),
      estimatedWaitTime: this.calculateWaitTime(queue.length, gameMode)
    };
  }

  // Helper methods
  calculateBattleAmount(gameMode) {
    const amounts = {
      normal: 10,
      jackpot: 25,
      pointRush: 15,
      lastChance: 20,
      shared: 30,
      upsideDown: 10
    };
    return amounts[gameMode] || 10;
  }

  getRoundsByMode(gameMode) {
    const rounds = {
      normal: 3,
      jackpot: 5,
      pointRush: 5,
      lastChance: 3,
      shared: 4,
      upsideDown: 3
    };
    return rounds[gameMode] || 3;
  }

  async getRandomPacks(count = 2) {
    // Get random packs from database
    const packs = await PackDraw.aggregate([
      { $match: { isApproved: true } },
      { $sample: { size: count } }
    ]);
    
    return packs.map(pack => pack._id);
  }

  calculateWaitTime(queueLength, gameMode) {
    const config = this.autoBattleConfigs[gameMode];
    const playersNeeded = Math.max(0, config.minPlayers - queueLength);
    
    if (playersNeeded === 0) {
      return 0; // Immediate match
    }
    
    // Estimate based on historical data (simplified)
    return playersNeeded * 30; // 30 seconds per player needed
  }

  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  notifyPlayersBattleReady(battle, players) {
    // This will be implemented with your socket system
    // Notify all players that battle is ready
    players.forEach(player => {
      // io.to(player.socketId).emit('battle-ready', { battleId: battle._id });
    });
  }

  // Cleanup old queue entries (run periodically)
  cleanupOldQueueEntries() {
    const now = new Date();
    const maxQueueTime = 10 * 60 * 1000; // 10 minutes

    Object.keys(this.battleQueues).forEach(gameMode => {
      this.battleQueues[gameMode] = this.battleQueues[gameMode].filter(player => {
        const timeInQueue = now - new Date(player.joinedAt);
        return timeInQueue < maxQueueTime;
      });
    });
  }
}

export default new MatchmakingService();