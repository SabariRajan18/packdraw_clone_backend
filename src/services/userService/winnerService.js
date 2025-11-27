class WinnerService {
  // Normal Mode - Highest total value wins
  calculateNormalWinner(playerStats, upsideDown = false) {
    if (upsideDown) {
      // Upside Down Normal Mode - Lowest total value wins
      const sorted = [...playerStats].sort((a, b) => a.totalValue - b.totalValue);
      return sorted[0];
    } else {
      // Normal Mode - Highest total value wins
      const sorted = [...playerStats].sort((a, b) => b.totalValue - a.totalValue);
      return sorted[0];
    }
  }

  // Last Chance Mode - Only last pack matters
  calculateLastChanceWinner(playerStats, upsideDown = false) {
    if (upsideDown) {
      // Upside Down Last Chance - Lowest last pack value wins
      const sorted = [...playerStats].sort((a, b) => a.lastPackValue - b.lastPackValue);
      return sorted[0];
    } else {
      // Last Chance - Highest last pack value wins
      const sorted = [...playerStats].sort((a, b) => b.lastPackValue - a.lastPackValue);
      return sorted[0];
    }
  }

  // Point Rush Mode - Most points wins
  calculatePointRushWinner(playerStats) {
    const sorted = [...playerStats].sort((a, b) => b.points - a.points);
    return sorted[0];
  }

  // Jackpot Mode - Random winner based on chances
  calculateJackpotWinner(playerStats, battleOptions) {
    const totalValue = playerStats.reduce((sum, stat) => sum + stat.totalValue, 0);
    
    // Calculate chances
    let chances = playerStats.map(stat => {
      if (battleOptions.upsideDown) {
        // Upside Down Jackpot - Less value = more chance
        return totalValue > 0 ? (totalValue - stat.totalValue) / totalValue : 1 / playerStats.length;
      } else {
        // Normal Jackpot - More value = more chance
        return totalValue > 0 ? stat.totalValue / totalValue : 1 / playerStats.length;
      }
    });

    // Normalize chances
    const totalChance = chances.reduce((sum, chance) => sum + chance, 0);
    chances = chances.map(chance => chance / totalChance);

    // Select random winner based on chances
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < playerStats.length; i++) {
      cumulative += chances[i];
      if (random <= cumulative) {
        return playerStats[i];
      }
    }

    return playerStats[playerStats.length - 1];
  }

  // Shared Mode - Equal distribution
  calculateSharedDistribution(playerStats, totalPrize) {
    const sharePerPlayer = totalPrize / playerStats.length;
    
    return {
      shares: playerStats.map(stat => ({
        userId: stat.userId,
        share: sharePerPlayer
      }))
    };
  }
}

export default new WinnerService();