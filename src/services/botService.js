// services/botService.js
class BotService {
  constructor() {
    this.botNames = [
      'AlphaBot', 'MegaBot', 'CyberBot', 'TurboBot', 'NitroBot',
      'ShadowBot', 'LightningBot', 'ThunderBot', 'BlazeBot', 'FrostBot',
      'SteelBot', 'IronBot', 'GoldBot', 'PlatinumBot', 'DiamondBot',
      'RubyBot', 'SapphireBot', 'EmeraldBot', 'CrystalBot', 'QuantumBot'
    ];
  }

  generateBotName() {
    const randomIndex = Math.floor(Math.random() * this.botNames.length);
    return this.botNames[randomIndex];
  }

  simulateBotAction(battle, playerIndex) {
    // Simulate bot thinking delay
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          action: 'ready',
          playerIndex: playerIndex
        });
      }, delay);
    });
  }
}

export default new BotService();