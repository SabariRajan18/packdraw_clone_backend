// services/battleService.js
import Battle from "../models/Battles.js"
import User from "../models/Users.js"
import GameLogicService from "./gameLogicService.js"
import BotService from "./botService.js"


class BattleService {
  constructor() {
    this.activeBattles = new Map();
  }

  async createBattle(battleData, userId) {
    try {
      const battle = new Battle({
        ...battleData,
        creatorId: userId,
        totalRounds: battleData.packsIds.length,
        players: [{
          userId: userId,
          isBot: false,
          username: battleData.creatorName || 'Player',
          seatIndex: 0,
          totalValue: 0,
          lastPrizeValue: 0,
          pointRushScore: 0,
          prizes: []
        }]
      });

      await battle.save();
      return battle;
    } catch (error) {
      console.error('Error creating battle:', error);
      throw error;
    }
  }

  async joinBattle(battleId, userId, username, socketId) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle || battle.status !== 'Waiting') {
        throw new Error('Battle not available');
      }

      if (battle.players.length >= battle.playersCount) {
        throw new Error('Battle is full');
      }

      // Check if user already joined
      const alreadyJoined = battle.players.some(p => 
        p.userId && p.userId.toString() === userId.toString()
      );
      
      if (alreadyJoined) {
       return {isjoined:true}
      }

      const seatIndex = battle.players.length;
      
      battle.players.push({
        userId: userId,
        isBot: false,
        username: username,
        socketId: socketId,
        seatIndex: seatIndex,
        totalValue: 0,
        lastPrizeValue: 0,
        pointRushScore: 0,
        prizes: []
      });

      await battle.save();
      return battle;
    } catch (error) {
      console.error('Error joining battle:', error);
      throw error;
    }
  }

  async addBotToBattle(battleId) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle || battle.status !== 'Waiting') {
        throw new Error('Battle not available');
      }

      if (battle.players.length >= battle.playersCount) {
        throw new Error('Battle is full');
      }

      const botName = BotService.generateBotName();
      const seatIndex = battle.players.length;
      
      battle.players.push({
        userId: null,
        isBot: true,
        username: botName,
        seatIndex: seatIndex,
        totalValue: 0,
        lastPrizeValue: 0,
        pointRushScore: 0,
        prizes: []
      });

      await battle.save();
      return battle;
    } catch (error) {
      console.error('Error adding bot:', error);
      throw error;
    }
  }

  async startBattle(battleId) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle || battle.status !== 'Waiting') {
        throw new Error('Cannot start battle');
      }

      if (battle.players.length < battle.minPlayers) {
        throw new Error(`Need at least ${battle.minPlayers} players to start`);
      }

      battle.status = 'Running';
      battle.currentRound = 0;
      await battle.save();

      // Add to active battles map
      this.activeBattles.set(battleId.toString(), battle);

      return battle;
    } catch (error) {
      console.error('Error starting battle:', error);
      throw error;
    }
  }

  async playRound(battleId, roundIndex) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle || battle.status !== 'Running') {
        throw new Error('Battle not running');
      }

      if (roundIndex >= battle.totalRounds) {
        throw new Error('Invalid round');
      }

      const packId = battle.packsIds[roundIndex];
      const roundResults = [];

      // Get prizes for all players in this round
      for (const player of battle.players) {
        const prize = await GameLogicService.getRandomPrizeFromPack(packId);
        
        player.prizes.push({
          packId: packId,
          roundIndex: roundIndex,
          itemId: prize.itemId,
          value: prize.value,
          name: prize.name,
          rarity: prize.rarity,
          image: prize.image
        });

        player.totalValue += prize.value;
        player.lastPrizeValue = prize.value; // Update last prize

        // Update jackpot pool for jackpot modes
        if (battle.gameMode.includes('JACKPOT')) {
          battle.jackpotPool += prize.value;
        }

        roundResults.push({
          playerIndex: player.seatIndex,
          playerName: player.username,
          prize: prize
        });
      }

      // Update point rush scores if applicable
      GameLogicService.updatePointRushScores(battle, roundResults);

      battle.currentRound = roundIndex + 1;
      
      // Check if battle is complete
      if (battle.currentRound >= battle.totalRounds) {
        await this.completeBattle(battle);
      } else {
        await battle.save();
      }

      return {
        battle,
        roundResults,
        isComplete: battle.currentRound >= battle.totalRounds
      };
    } catch (error) {
      console.error('Error playing round:', error);
      throw error;
    }
  }

  async completeBattle(battle) {
    try {
      // Calculate winner
      const { winnerIndex, reason, isSharedMode } = GameLogicService.calculateWinner(battle);
      
      battle.winnerPlayerIndex = winnerIndex;
      battle.status = 'Completed';
      battle.finishedAt = new Date();

      if (winnerIndex !== null && battle.players[winnerIndex]) {
        const winner = battle.players[winnerIndex];
        battle.winnerUserId = winner.userId;
        
        // Calculate winnings
        if (isSharedMode) {
          // Shared mode: split winnings equally
          const sharePerPlayer = battle.jackpotPool / battle.players.length;
          battle.players.forEach(player => {
            battle.winnerPrize = sharePerPlayer;
            // Update user wallet here
            this.updateUserWallet(player.userId, sharePerPlayer);
          });
        } else {
          // Normal mode: winner takes all
          battle.winnerPrize = battle.jackpotPool || battle.battleAmount;
          this.updateUserWallet(winner.userId, battle.winnerPrize);
        }
      }

      await battle.save();
      
      // Update user stats
      await this.updateUserBattleStats(battle);

      // Remove from active battles
      this.activeBattles.delete(battle._id.toString());

      return battle;
    } catch (error) {
      console.error('Error completing battle:', error);
      throw error;
    }
  }

  async updateUserWallet(userId, amount) {
    if (!userId) return;
    
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: amount, totalWinnings: amount }
      });
    } catch (error) {
      console.error('Error updating user wallet:', error);
    }
  }

  async updateUserBattleStats(battle) {
    try {
      for (const player of battle.players) {
        if (player.userId) {
          const updateData = {
            $inc: { totalBattles: 1 }
          };

          if (player.userId.toString() === battle.winnerUserId?.toString()) {
            updateData.$inc.wins = 1;
          } else {
            updateData.$inc.losses = 1;
          }

          await User.findByIdAndUpdate(player.userId, updateData);
        }
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  async getWaitingBattles(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const battles = await Battle.find({
        status: 'Waiting',
        isPrivate: false
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'username avatar')
      .lean();

      return battles;
    } catch (error) {
      console.error('Error getting waiting battles:', error);
      throw error;
    }
  }

  async getBattleDetails(battleId) {
    try {
      const battle = await Battle.findById(battleId)
        .populate({
          path: 'creatorId',
          select: 'userName profileImage'
        })
        .populate({
          path: 'packsIds',
          select: 'name packAmount wallpaper items',
          populate: [
            {
              path: 'items',
              model: 'PacksItems',
              select: 'name image description amount'
            },
            {
              path: 'wallpaper',
              model: 'PacksImages',
              select: 'wallpaper name'
            }
          ]
        })
        .populate({
          path: 'players.userId',
          select: 'userName profileImage'
        })
        .populate({
          path: 'winnerUserId',
          select: 'userName profileImage'
        })
        .lean();
  
      return battle;
    } catch (error) {
      console.error("Error getting battle details:", error);
      throw error;
    }
  }
  
  
  
  async cancelBattle(battleId, userId) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle) {
        throw new Error('Battle not found');
      }

      if (battle.creatorId.toString() !== userId.toString()) {
        throw new Error('Only creator can cancel battle');
      }

      if (battle.status !== 'Waiting') {
        throw new Error('Cannot cancel running or completed battle');
      }

      battle.status = 'Cancelled';
      await battle.save();

      return battle;
    } catch (error) {
      console.error('Error cancelling battle:', error);
      throw error;
    }
  }
}

export default new BattleService();