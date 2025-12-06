// cron/scheduler.js
import cron from 'node-cron';
import BattleCleanupService from '../services/battleCleanupService.js';

class CronScheduler {
  init() {
    console.log('Initializing cron jobs...');
    
    // Run every 5 minutes: Cleanup expired waiting battles
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running expired battle cleanup...');
      await BattleCleanupService.cleanupExpiredBattles();
    });

    // Run every 10 minutes: Cleanup inactive running battles
    cron.schedule('*/10 * * * *', async () => {
      console.log('Running inactive battle cleanup...');
      await BattleCleanupService.cleanupInactiveRunningBattles();
    });

    // Run every 30 minutes: Cleanup abandoned battles
    cron.schedule('*/30 * * * *', async () => {
      console.log('Running abandoned battle cleanup...');
      await BattleCleanupService.cleanupAbandonedBattles();
    });

    // Run daily at 2 AM: Archive old battles
    cron.schedule('0 2 * * *', async () => {
      console.log('Running old battle archive cleanup...');
      await BattleCleanupService.cleanupOldBattles();
    });

    // Run on server startup
    this.runStartupCleanup();
    
    console.log('Cron jobs initialized successfully');
  }

  async runStartupCleanup() {
    try {
      console.log('Running startup cleanup...');
      await BattleCleanupService.cleanupExpiredBattles();
      await BattleCleanupService.cleanupInactiveRunningBattles();
      await BattleCleanupService.cleanupAbandonedBattles();
      console.log('Startup cleanup completed');
    } catch (error) {
      console.error('Error during startup cleanup:', error);
    }
  }
}

export default new CronScheduler();