import Users from '../../models/Users.js';
import PacksItems from '../../models/PacksItems.js';

class BotService {
  // Bot configurations for different difficulties
  botConfigs = {
    easy: {
      namePrefix: 'EasyBot',
      reactionDelay: 2000,
      winRate: 0.3,
      skillLevel: 0.4
    },
    medium: {
      namePrefix: 'ProBot', 
      reactionDelay: 1500,
      winRate: 0.5,
      skillLevel: 0.6
    },
    hard: {
      namePrefix: 'MasterBot',
      reactionDelay: 1000,
      winRate: 0.7,
      skillLevel: 0.8
    }
  };

  // Generate bot players for empty slots
  async generateBots(battleId, numBotsNeeded, difficulty = 'medium') {
    try {
      const bots = [];
      
      for (let i = 0; i < numBotsNeeded; i++) {
        const botConfig = this.botConfigs[difficulty];
        const botNumber = Math.floor(Math.random() * 1000);
        
        const bot = {
          userId: this.generateBotId(),
          username: `${botConfig.namePrefix}_${botNumber}`,
          isBot: true,
          botDifficulty: difficulty,
          avatar: this.getRandomBotAvatar(),
          ready: true,
          joinedAt: new Date()
        };
        
        bots.push(bot);
      }
      
      return bots;
    } catch (error) {
      console.error('Generate bots error:', error);
      return [];
    }
  }

  // Simulate bot pack opening with intelligence
  async simulateBotPackOpening(packId, botDifficulty, battleGameMode) {
    try {
      const pack = await PackDraw.findById(packId).populate('items');
      if (!pack) throw new Error('Pack not found');

      const config = this.botConfigs[botDifficulty];
      const selectedItems = [];
      let totalValue = 0;

      // Bot intelligence based on difficulty and game mode
      const intelligenceFactor = config.skillLevel;
      
      // Get pack items and sort by value
      const sortedItems = [...pack.items].sort((a, b) => 
        (b.value || 0) - (a.value || 0)
      );

      // Bot strategy based on game mode
      const strategy = this.getBotStrategy(battleGameMode, botDifficulty);
      
      // Select items based on strategy
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
      
      for (let i = 0; i < numItems; i++) {
        const selectedItem = this.selectItemByStrategy(sortedItems, strategy, intelligenceFactor);
        if (selectedItem) {
          const itemValue = this.calculateBotItemValue(selectedItem, pack, strategy);
          selectedItems.push({
            itemId: selectedItem._id,
            name: selectedItem.name,
            value: itemValue,
            rarity: selectedItem.rarity || 'common',
            image: selectedItem.image || 'default-item.jpg'
          });
          totalValue += itemValue;
        }
      }

      // Add some randomness based on difficulty
      totalValue = this.applyBotVariance(totalValue, botDifficulty);

      return {
        username: `Bot_${botDifficulty}`,
        items: selectedItems,
        totalValue: Math.max(0, totalValue),
        packName: pack.name,
        isBot: true
      };
    } catch (error) {
      console.error('Bot pack opening error:', error);
      return this.getDefaultBotResult(botDifficulty);
    }
  }

  // Bot strategies for different game modes
  getBotStrategy(gameMode, difficulty) {
    const strategies = {
      normal: {
        target: 'high', // Aim for high value items
        variance: 0.2
      },
      jackpot: {
        target: 'high', // High value for better chances
        variance: 0.3
      },
      pointRush: {
        target: 'low', // Low value for points
        variance: 0.4
      },
      lastChance: {
        target: 'mixed', // Mixed strategy
        variance: 0.5
      },
      shared: {
        target: 'high', // High value benefits everyone
        variance: 0.2
      },
      upsideDown: {
        target: 'low', // Low value to win
        variance: 0.3
      }
    };

    // Adjust strategy based on difficulty
    const baseStrategy = strategies[gameMode] || strategies.normal;
    return {
      ...baseStrategy,
      // Higher difficulty = better strategy execution
      execution: this.botConfigs[difficulty].skillLevel
    };
  }

  // Intelligent item selection
  selectItemByStrategy(items, strategy, intelligence) {
    if (!items.length) return null;

    const target = strategy.target;
    const variance = strategy.variance * (1 - intelligence); // Better bots have less variance

    if (target === 'high') {
      // Prefer high value items, but with some randomness
      const topItems = items.slice(0, Math.max(1, Math.floor(items.length * 0.3)));
      return this.getWeightedRandomItem(topItems, variance);
    } else if (target === 'low') {
      // Prefer low value items
      const bottomItems = items.slice(-Math.max(1, Math.floor(items.length * 0.3)));
      return this.getWeightedRandomItem(bottomItems, variance);
    } else {
      // Mixed strategy - random selection
      return items[Math.floor(Math.random() * items.length)];
    }
  }

  getWeightedRandomItem(items, variance) {
    // Higher variance = more random, lower variance = more strategic
    const randomIndex = Math.floor(
      Math.pow(Math.random(), 1 + variance) * items.length
    );
    return items[Math.min(randomIndex, items.length - 1)];
  }

  calculateBotItemValue(item, pack, strategy) {
    let baseValue = item.value || 10;
    
    // Apply rarity multipliers
    if (item.rarity === 'rare') {
      baseValue *= (pack.rareMultiPlayer || 10);
    } else if (item.rarity === 'epic') {
      baseValue *= (pack.epicMultiPlayer || 20);
    }

    // Bot execution affects value consistency
    const executionFactor = 0.8 + (strategy.execution * 0.4); // 0.8-1.2 range
    return baseValue * executionFactor;
  }

  applyBotVariance(value, difficulty) {
    const config = this.botConfigs[difficulty];
    const variance = (1 - config.skillLevel) * 0.5; // 0.1 to 0.5 variance
    const randomFactor = 1 + (Math.random() * variance * 2 - variance);
    return value * randomFactor;
  }

  // Helper methods
  generateBotId() {
    return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRandomBotAvatar() {
    const avatars = [
      'bot_avatar1.png', 'bot_avatar2.png', 'bot_avatar3.png',
      'bot_avatar4.png', 'bot_avatar5.png'
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  getDefaultBotResult(difficulty) {
    const baseValue = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35;
    return {
      username: `Bot_${difficulty}`,
      items: [{
        name: 'Default Item',
        value: baseValue,
        rarity: 'common',
        image: 'default-item.jpg'
      }],
      totalValue: baseValue,
      isBot: true
    };
  }
}

export default new BotService();