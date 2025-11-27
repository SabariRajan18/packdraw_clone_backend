// utils/gameLogic.js
import WinnerService from '../services/userService/winnerService.js';

export function calculateWinner(battle, battleSession) {
  const { battleGameMode, battleOptions, settings } = battle;
  const { playerStats, jackpotPool } = battleSession;

  const totalPrize = playerStats.reduce((sum, stat) => sum + stat.totalValue, 0);
  let winner;
  let prizeDistribution = [];

  switch (battleGameMode) {
    case 'normal':
      winner = WinnerService.calculateNormalWinner(playerStats, battleOptions.upsideDown);
      break;
      
    case 'lastChance':
      winner = WinnerService.calculateLastChanceWinner(playerStats, battleOptions.upsideDown);
      break;
      
    case 'pointRush':
      winner = WinnerService.calculatePointRushWinner(playerStats);
      break;
      
    case 'jackpot':
      winner = WinnerService.calculateJackpotWinner(playerStats, battleOptions);
      break;
      
    case 'shared':
      const sharedResult = WinnerService.calculateSharedDistribution(playerStats, totalPrize);
      prizeDistribution = sharedResult.shares.map((share, index) => ({
        userId: share.userId,
        username: playerStats.find(p => p.userId.toString() === share.userId.toString())?.username,
        prizeValue: playerStats.find(p => p.userId.toString() === share.userId.toString())?.totalValue || 0,
        share: share.share,
        points: playerStats.find(p => p.userId.toString() === share.userId.toString())?.points || 0,
        position: index + 1
      }));
      
      return {
        winner: null,
        prizeDistribution,
        jackpotPool,
        totalPrize,
        winnerPrize: sharedResult.shares[0]?.share || 0,
        isShared: true
      };
      
    case 'upsideDown':
      if (battleOptions.lastChance) {
        winner = WinnerService.calculateLastChanceWinner(playerStats, true);
      } else {
        winner = WinnerService.calculateNormalWinner(playerStats, true);
      }
      break;
      
    default:
      winner = WinnerService.calculateNormalWinner(playerStats);
  }

  // Calculate prize distribution for competitive modes
  const sortedStats = [...playerStats].sort((a, b) => b.totalValue - a.totalValue);
  prizeDistribution = sortedStats.map((stat, index) => ({
    userId: stat.userId,
    username: stat.username,
    prizeValue: stat.totalValue,
    points: stat.points,
    position: index + 1,
    share: stat.userId.toString() === winner.userId.toString() ? settings.prizePool : 0
  }));

  return {
    winner: winner.userId,
    prizeDistribution,
    jackpotPool,
    totalPrize,
    winnerPrize: settings.prizePool
  };
}

export function calculateChances(playerStats, battleOptions) {
  if (battleOptions.upsideDown) {
    const totalValue = playerStats.reduce((sum, stat) => sum + stat.totalValue, 0);
    return playerStats.map(stat => ({
      ...stat,
      chance: totalValue > 0 ? (totalValue - stat.totalValue) / totalValue : 1 / playerStats.length
    }));
  } else {
    const totalValue = playerStats.reduce((sum, stat) => sum + stat.totalValue, 0);
    return playerStats.map(stat => ({
      ...stat,
      chance: totalValue > 0 ? stat.totalValue / totalValue : 1 / playerStats.length
    }));
  }
}