// services/socketService.js
import  { Server } from "socket.io"

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.userSocketMap = new Map();
    this.battleSocketMap = new Map();
    
    this.initializeSocketHandlers();
  }

  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);

      // User authentication
      socket.on('authenticate', (data) => {
        const { userId } = data;
        if (userId) {
          this.userSocketMap.set(userId, socket.id);
          socket.userId = userId;
          console.log(`User ${userId} connected with socket ${socket.id}`);
        }
      });

      // Battle lobby events
      socket.on('joinBattleLobby', async (data) => {
        const { battleId } = data;
        socket.join(`battle:${battleId}`);
        this.battleSocketMap.set(socket.id, battleId);
        
        // Notify others in battle
        socket.to(`battle:${battleId}`).emit('playerJoined', {
          socketId: socket.id,
          timestamp: new Date()
        });
      });

      socket.on('leaveBattleLobby', (data) => {
        const { battleId } = data;
        socket.leave(`battle:${battleId}`);
        this.battleSocketMap.delete(socket.id);
      });

      // Player ready status
      socket.on('playerReady', async (data) => {
        const { battleId, playerIndex } = data;
        
        this.io.to(`battle:${battleId}`).emit('playerReadyUpdate', {
          playerIndex,
          isReady: true
        });

        // Check if all players are ready
        await this.checkAllPlayersReady(battleId);
      });

      // Start battle
      socket.on('startBattle', async (data) => {
        const { battleId } = data;
        try {
          const battle = await BattleService.startBattle(battleId);
          
          this.io.to(`battle:${battleId}`).emit('battleStarted', {
            battle,
            countdown: 3
          });

          // Start countdown
          this.startBattleCountdown(battleId);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Add bot to battle
      socket.on('addBot', async (data) => {
        const { battleId } = data;
        try {
          const battle = await BattleService.addBotToBattle(battleId);
          
          this.io.to(`battle:${battleId}`).emit('botAdded', {
            battle,
            botIndex: battle.players.length - 1
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Play round
      socket.on('playRound', async (data) => {
        const { battleId, roundIndex } = data;
        try {
          const result = await BattleService.playRound(battleId, roundIndex);
          
          this.io.to(`battle:${battleId}`).emit('roundPlayed', {
            roundResults: result.roundResults,
            battle: result.battle,
            isComplete: result.isComplete
          });

          // If battle complete, send winner
          if (result.isComplete) {
            this.io.to(`battle:${battleId}`).emit('battleComplete', {
              battle: result.battle,
              winnerIndex: result.battle.winnerPlayerIndex,
              winnerPrize: result.battle.winnerPrize
            });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        
        // Remove from user socket map
        if (socket.userId) {
          this.userSocketMap.delete(socket.userId);
        }
        
        // Remove from battle socket map
        const battleId = this.battleSocketMap.get(socket.id);
        if (battleId) {
          this.io.to(`battle:${battleId}`).emit('playerDisconnected', {
            socketId: socket.id
          });
          this.battleSocketMap.delete(socket.id);
        }
      });
    });
  }

  async checkAllPlayersReady(battleId) {
    // Implement logic to check if all players are ready
    // This would involve checking a ready status in the battle document
  }

  startBattleCountdown(battleId) {
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
      this.io.to(`battle:${battleId}`).emit('countdown', {
        count: countdown
      });

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.io.to(`battle:${battleId}`).emit('startOpening');
      }
      
      countdown--;
    }, 1000);
  }

  // Helper method to emit to specific user
  emitToUser(userId, event, data) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Helper method to emit to battle
  emitToBattle(battleId, event, data) {
    this.io.to(`battle:${battleId}`).emit(event, data);
  }

  getIO() {
    return this.io;
  }
}

export default  SocketService;