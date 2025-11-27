import PackDraw from '../../models/PackDraw.js';
import PacksItems from '../../models/PacksItems.js';

class PackService {
  // Rarity distribution probabilities
  rarityProbabilities = {
    common: 0.60,    // 60%
    uncommon: 0.25,  // 25% 
    rare: 0.10,      // 10%
    epic: 0.04,      // 4%
    legendary: 0.01  // 1%
  };

  // Item value ranges by rarity
  valueRanges = {
    common: { min: 1, max: 50 },
    uncommon: { min: 30, max: 150 },
    rare: { min: 100, max: 500 },
    epic: { min: 400, max: 2000 },
    legendary: { min: 1500, max: 10000 }
  };

  // Open pack with real probability system
  async openPackWithProbability(packId, userId) {
    try {
      const pack = await PackDraw.findById(packId).populate('items');
      if (!pack) throw new Error('Pack not found');

      const user = await Users.findById(userId);
      const selectedItems = [];
      let totalValue = 0;

      // Determine number of items (1-5 based on pack value)
      const numItems = this.calculateItemCount(pack.packAmount);
      
      for (let i = 0; i < numItems; i++) {
        const item = await this.selectItemWithProbability(pack);
        if (item) {
          const itemValue = this.calculateItemValue(item, pack);
          selectedItems.push({
            itemId: item._id,
            name: item.name,
            value: itemValue,
            rarity: item.rarity,
            image: item.image,
            probability: this.calculateItemProbability(item.rarity)
          });
          totalValue += itemValue;
        }
      }

      // Apply pack multipliers
      totalValue = this.applyPackMultipliers(totalValue, pack);

      return {
        username: user?.username || 'Player',
        items: selectedItems,
        totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal
        packName: pack.name,
        packValue: pack.packAmount
      };
    } catch (error) {
      console.error('Pack opening error:', error);
      throw new Error('Failed to open pack');
    }
  }

  // Calculate how many items based on pack value
  calculateItemCount(packAmount) {
    if (packAmount < 10) return 1;
    if (packAmount < 50) return 2;
    if (packAmount < 100) return 3;
    if (packAmount < 500) return 4;
    return 5;
  }

  // Select item based on probability system
  async selectItemWithProbability(pack) {
    // If pack has predefined items, use them
    if (pack.items && pack.items.length > 0) {
      return this.selectFromPackItems(pack.items);
    }
    
    // Otherwise generate item based on probabilities
    return this.generateRandomItem();
  }

  // Select from pack's predefined items with weighted probability
  selectFromPackItems(items) {
    // Create weighted array based on item rarity
    const weightedItems = [];
    
    items.forEach(item => {
      const weight = this.getRarityWeight(item.rarity);
      for (let i = 0; i < weight; i++) {
        weightedItems.push(item);
      }
    });

    // Select random item from weighted array
    if (weightedItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * weightedItems.length);
      return weightedItems[randomIndex];
    }

    return this.generateRandomItem();
  }

  // Generate random item based on probability
  generateRandomItem() {
    const rarity = this.selectRarity();
    const valueRange = this.valueRanges[rarity];
    const value = valueRange.min + Math.random() * (valueRange.max - valueRange.min);
    
    return {
      _id: this.generateItemId(),
      name: this.generateItemName(rarity),
      value: Math.round(value * 100) / 100,
      rarity: rarity,
      image: this.getItemImage(rarity)
    };
  }

  // Select rarity based on probability
  selectRarity() {
    const random = Math.random();
    let cumulative = 0;

    for (const [rarity, probability] of Object.entries(this.rarityProbabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return rarity;
      }
    }

    return 'common'; // Fallback
  }

  // Get weight for rarity (for weighted selection)
  getRarityWeight(rarity) {
    const weights = {
      common: 1,
      uncommon: 3,
      rare: 10,
      epic: 25,
      legendary: 100
    };
    return weights[rarity] || 1;
  }

  // Calculate item value with multipliers
  calculateItemValue(item, pack) {
    let value = item.value || 10;

    // Apply pack multipliers
    if (item.rarity === 'rare') {
      value *= (pack.rareMultiPlayer || 10);
    } else if (item.rarity === 'epic') {
      value *= (pack.epicMultiPlayer || 20);
    } else if (item.rarity === 'legendary') {
      value *= (pack.epicMultiPlayer * 2 || 40);
    }

    // Small random variance ±10%
    const variance = 0.9 + (Math.random() * 0.2);
    return value * variance;
  }

  // Apply pack-specific multipliers
  applyPackMultipliers(totalValue, pack) {
    // Premium packs get bonus
    if (pack.packAmount > 100) {
      totalValue *= 1.1; // 10% bonus
    }
    if (pack.packAmount > 500) {
      totalValue *= 1.2; // 20% bonus
    }

    return totalValue;
  }

  // Calculate item probability for display
  calculateItemProbability(rarity) {
    return this.rarityProbabilities[rarity] || 0.01;
  }

  // Helper methods
  generateItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateItemName(rarity) {
    const prefixes = {
      common: ['Basic', 'Simple', 'Standard'],
      uncommon: ['Enhanced', 'Improved', 'Quality'],
      rare: ['Exceptional', 'Superior', 'Premium'],
      epic: ['Epic', 'Mythical', 'Ancient'],
      legendary: ['Legendary', 'Divine', 'Immortal']
    };

    const suffixes = ['Sword', 'Shield', 'Armor', 'Potion', 'Ring', 'Amulet'];
    const prefixList = prefixes[rarity] || prefixes.common;
    
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  getItemImage(rarity) {
    const images = {
      common: 'common_item.png',
      uncommon: 'uncommon_item.png', 
      rare: 'rare_item.png',
      epic: 'epic_item.png',
      legendary: 'legendary_item.png'
    };
    return images[rarity] || 'common_item.png';
  }
}

export default new PackService();