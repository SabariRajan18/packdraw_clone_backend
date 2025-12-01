// services/gameLogicService.js

import PackDraw from "../models/Packdraw.js";

class GameLogicService {
  constructor() {
    this.prizeCache = new Map();
  }

  // Calculate winner based on game mode
  calculateWinner(battle) {
    switch (battle.gameMode) {
      case 'NORMAL':
        return this.calculateNormalWinner(battle);
      case 'JACKPOT':
        return this.calculateJackpotWinner(battle);
      case 'LAST_CHANCE_JACKPOT':
        return this.calculateLastChanceJackpotWinner(battle);
      case 'UPSIDE_DOWN_JACKPOT':
        return this.calculateUpsideDownJackpotWinner(battle);
      case 'UPSIDE_DOWN_NORMAL':
        return this.calculateUpsideDownNormalWinner(battle);
      case 'UPSIDE_DOWN_POINT_RUSH':
        return this.calculateUpsideDownPointRushWinner(battle);
      case 'LAST_CHANCE_NORMAL':
        return this.calculateLastChanceNormalWinner(battle);
      case 'LAST_CHANCE_UPSIDE_DOWN_NORMAL':
        return this.calculateLastChanceUpsideDownNormalWinner(battle);
      case 'SHARED':
        return this.calculateSharedWinner(battle);
      default:
        return this.calculateNormalWinner(battle);
    }
  }

  calculateNormalWinner(battle) {
    let maxValue = -1;
    let winnerIndex = null;

    battle.players.forEach((player, index) => {
      if (player.totalValue > maxValue) {
        maxValue = player.totalValue;
        winnerIndex = index;
      }
    });

    return { winnerIndex, reason: 'Highest total value' };
  }

  calculateJackpotWinner(battle) {
    // Weighted random based on contribution to jackpot
    const weights = battle.players.map(player => player.totalValue);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    if (totalWeight === 0) {
      // If no values, pick random
      return { 
        winnerIndex: Math.floor(Math.random() * battle.players.length),
        reason: 'Random selection (no contributions)'
      };
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return { winnerIndex: i, reason: 'Weighted random based on contribution' };
      }
    }
    
    return { winnerIndex: 0, reason: 'Weighted random (fallback)' };
  }

  calculateLastChanceJackpotWinner(battle) {
    // Only last prize matters for jackpot odds
    const weights = battle.players.map(player => player.lastPrizeValue);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    if (totalWeight === 0) {
      return { 
        winnerIndex: Math.floor(Math.random() * battle.players.length),
        reason: 'Random selection (no last prizes)'
      };
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return { winnerIndex: i, reason: 'Weighted random based on last prize' };
      }
    }
    
    return { winnerIndex: 0, reason: 'Weighted random (fallback)' };
  }

  calculateUpsideDownJackpotWinner(battle) {
    // Inverse weighted random (smaller values have higher chance)
    const values = battle.players.map(player => player.totalValue);
    const maxValue = Math.max(...values);
    
    // Add small epsilon to avoid division by zero
    const inverseWeights = values.map(value => (maxValue - value + 1));
    const totalWeight = inverseWeights.reduce((a, b) => a + b, 0);
    
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (let i = 0; i < inverseWeights.length; i++) {
      cumulative += inverseWeights[i];
      if (random <= cumulative) {
        return { winnerIndex: i, reason: 'Inverse weighted random' };
      }
    }
    
    return { winnerIndex: 0, reason: 'Inverse weighted random (fallback)' };
  }

  calculateUpsideDownNormalWinner(battle) {
    let minValue = Infinity;
    let winnerIndex = null;

    battle.players.forEach((player, index) => {
      if (player.totalValue < minValue) {
        minValue = player.totalValue;
        winnerIndex = index;
      }
    });

    return { winnerIndex, reason: 'Lowest total value' };
  }

  calculateUpsideDownPointRushWinner(battle) {
    let maxScore = -1;
    let winnerIndex = null;

    battle.players.forEach((player, index) => {
      if (player.pointRushScore > maxScore) {
        maxScore = player.pointRushScore;
        winnerIndex = index;
      }
    });

    return { winnerIndex, reason: 'Highest point rush score' };
  }

  calculateLastChanceNormalWinner(battle) {
    let maxLastPrize = -1;
    let winnerIndex = null;

    battle.players.forEach((player, index) => {
      if (player.lastPrizeValue > maxLastPrize) {
        maxLastPrize = player.lastPrizeValue;
        winnerIndex = index;
      }
    });

    return { winnerIndex, reason: 'Highest last prize value' };
  }

  calculateLastChanceUpsideDownNormalWinner(battle) {
    let minLastPrize = Infinity;
    let winnerIndex = null;

    battle.players.forEach((player, index) => {
      if (player.lastPrizeValue < minLastPrize) {
        minLastPrize = player.lastPrizeValue;
        winnerIndex = index;
      }
    });

    return { winnerIndex, reason: 'Lowest last prize value' };
  }

  calculateSharedWinner(battle) {
    // In shared mode, all players win equally
    // Return the creator as winner for record keeping
    return { 
      winnerIndex: 0, 
      reason: 'Shared mode - all players win equally',
      isSharedMode: true
    };
  }

  // Get random prize from pack
  async getRandomPrizeFromPack(packId) {
    try {
      const pack = await PackDraw.findById(packId).populate('items');
      if (!pack || !pack.items || pack.items.length === 0) {
        return this.getDefaultPrize();
      }

      // Get all items
      const items = pack.items;
      
      // Simple random selection (you can implement rarity weighting here)
      const randomIndex = Math.floor(Math.random() * items.length);
      const selectedItem = items[randomIndex];
      
      return {
        itemId: selectedItem._id,
        name: selectedItem.name || 'Unknown Item',
        value: selectedItem.value || 0,
        rarity: selectedItem.rarity || 'common',
        image: selectedItem.image || ''
      };
    } catch (error) {
      console.error('Error getting random prize:', error);
      return this.getDefaultPrize();
    }
  }

  getDefaultPrize() {
    return {
      itemId: null,
      name: 'Default Prize',
      value: 1,
      rarity: 'common',
      image: ''
    };
  }

  // Update player scores for point rush mode
  updatePointRushScores(battle, roundResults) {
    if (battle.gameMode !== 'UPSIDE_DOWN_POINT_RUSH') {
      return;
    }

    // Find minimum value in this round
    const roundValues = roundResults.map(r => r.prize.value);
    const minValue = Math.min(...roundValues);
    
    // Award points to players with minimum value
    roundResults.forEach((result, index) => {
      if (result.prize.value === minValue) {
        battle.players[index].pointRushScore += 1;
      }
    });
  }
}

export default new GameLogicService();