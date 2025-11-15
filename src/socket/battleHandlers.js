// socket/battleHandlers.js
import BattleModel from '../models/Battle.js';
import BattleSessionModel from '../models/BattleSession.js';
import { calculateWinner } from '../utils/battleLogic.js';

 class BattleHandlers {
  async handleJoinBattle(socket, data) {
    try {
      const { battleId, team } = data;
      
      const battle = await BattleModel.findById(battleId);
      if (!battle) {
        socket.emit('error', { message: 'Battle not found' });
        return;
      }

      // Join socket room for this battle
      socket.join(`battle_${battleId}`);
      
      // Add user to battle room tracking
      if (!socketManager.battleRooms.has(battleId)) {
        socketManager.battleRooms.set(battleId, new Set());
      }
      socketManager.battleRooms.get(battleId).add(socket.id);

      // Notify others in battle
      socket.to(`battle_${battleId}`).emit('player_joined', {
        userId: socket.userId,
        username: socket.username,
        team,
        timestamp: new Date()
      });

      // Send current battle state to joining player
      const battleState = await this.getBattleState(battleId);
      socket.emit('battle_state', battleState);

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  async handleStartBattle(socket, data) {
    try {
      const { battleId } = data;
      
      const battle = await BattleModel.findById(battleId);
      if (battle.creatorId.toString() !== socket.userId.toString()) {
        socket.emit('error', { message: 'Only battle creator can start' });
        return;
      }

      // Add bots if needed
      await this.addBotsToBattle(battle);

      // Update battle status
      battle.status = 'active';
      battle.startedAt = new Date();
      await battle.save();

      // Create battle session
      const battleSession = new BattleSessionModel({
        battleId: battle._id,
        playerStats: battle.players.map(player => ({
          userId: player.userId,
          totalValue: 0,
          points: 0,
          lastPackValue: 0,
          chances: 0
        }))
      });
      await battleSession.save();

      // Start countdown sequence
      await this.startCountdown(battleId);

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  async startCountdown(battleId) {
    // Emit countdown to all battle participants
    socketManager.io.to(`battle_${battleId}`).emit('countdown_start');
    
    // Countdown sequence: 3, 2, 1, GO!
    for (let i = 3; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      socketManager.io.to(`battle_${battleId}`).emit('countdown', { number: i });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    socketManager.io.to(`battle_${battleId}`).emit('battle_start');
    
    // Start pack opening sequence
    this.startPackOpeningSequence(battleId);
  }
}

export default new BattleHandlers();
