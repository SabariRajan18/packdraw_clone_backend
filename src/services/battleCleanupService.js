// services/battleCleanupService.js
import Battle from "../models/Battles.js"
import User from "../models/Users.js"

class BattleCleanupService {
  constructor() {
    this.BATTLE_WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    this.BATTLE_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  }

  async cleanupExpiredBattles() {
    try {
      const cutoffTime = new Date(Date.now() - this.BATTLE_WAIT_TIMEOUT);
      
      const expiredBattles = await Battle.find({
        status: 'Waiting',
        createdAt: { $lt: cutoffTime }
      });

      for (const battle of expiredBattles) {
        await this.autoCancelBattle(battle._id);
      }

      console.log(`Cleaned up ${expiredBattles.length} expired waiting battles`);
    } catch (error) {
      console.error('Error cleaning up expired battles:', error);
    }
  }

  async cleanupInactiveRunningBattles() {
    try {
      const cutoffTime = new Date(Date.now() - this.BATTLE_INACTIVITY_TIMEOUT);
      
      const inactiveBattles = await Battle.find({
        status: 'Running',
        lastActivity: { $lt: cutoffTime }
      });

      for (const battle of inactiveBattles) {
        await this.autoCancelBattle(battle._id);
      }

      console.log(`Cleaned up ${inactiveBattles.length} inactive running battles`);
    } catch (error) {
      console.error('Error cleaning up inactive battles:', error);
    }
  }

  async autoCancelBattle(battleId) {
    try {
      const battle = await Battle.findById(battleId);
      
      if (!battle) {
        return;
      }

      if (battle.status === 'Waiting' || battle.status === 'Running') {
        battle.status = 'Cancelled';
        battle.finishedAt = new Date();
        battle.cancellationReason = battle.status === 'Waiting' 
          ? 'Auto-cancelled: Battle not started in time' 
          : 'Auto-cancelled: Battle inactive for too long';
        
        await battle.save();

        // Refund entry fees if applicable
        await this.refundEntryFees(battle);

        console.log(`Battle ${battleId} auto-cancelled: ${battle.cancellationReason}`);
      }
    } catch (error) {
      console.error('Error auto-cancelling battle:', error);
    }
  }

  async refundEntryFees(battle) {
    try {
      if (battle.entryFee > 0) {
        for (const player of battle.players) {
          if (player.userId && !player.isBot) {
            await User.findByIdAndUpdate(player.userId, {
              $inc: { walletBalance: battle.entryFee }
            });
            console.log(`Refunded ${battle.entryFee} to user ${player.userId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error refunding entry fees:', error);
    }
  }

  // Cleanup abandoned battles (no players left)
  async cleanupAbandonedBattles() {
    try {
      const abandonedBattles = await Battle.find({
        status: { $in: ['Waiting', 'Running'] },
        'players.0': { $exists: false } // No players
      });

      for (const battle of abandonedBattles) {
        battle.status = 'Cancelled';
        battle.finishedAt = new Date();
        battle.cancellationReason = 'Auto-cancelled: Battle abandoned';
        await battle.save();
      }

      console.log(`Cleaned up ${abandonedBattles.length} abandoned battles`);
    } catch (error) {
      console.error('Error cleaning up abandoned battles:', error);
    }
  }

  // Cleanup old completed/cancelled battles (archive)
  async cleanupOldBattles() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Battle.deleteMany({
        status: { $in: ['Completed', 'Cancelled'] },
        finishedAt: { $lt: thirtyDaysAgo }
      });

      console.log(`Archived ${result.deletedCount} old battles`);
    } catch (error) {
      console.error('Error archiving old battles:', error);
    }
  }
}

export default new BattleCleanupService();