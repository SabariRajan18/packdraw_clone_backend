// services/socketService.js
import { Server } from "socket.io";
import BattleService from "./BattleService.js";
import jwt from 'jsonwebtoken';

class SocketService {
  constructor(server) {
    this.io = server

    this.userSocketMap = new Map(); // userId -> socketId
    this.socketUserMap = new Map(); // socketId -> userId
    this.battleSocketMap = new Map(); // socketId -> battleId
    
    this.initializeSocketHandlers();
  }

  initializeSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id, 'User:', socket.userId);

      // Store user-socket mapping
      if (socket.userId) {
        this.userSocketMap.set(socket.userId, socket.id);
        this.socketUserMap.set(socket.id, socket.userId);
      }

      // Authenticate
      socket.on('authenticate', (data) => {
        console.log('User authenticated:', socket.userId);
      });

      // Join battle lobby
      socket.on('joinBattleLobby', async (data) => {
        const { battleId } = data;
        socket.join(`battle:${battleId}`);
        this.battleSocketMap.set(socket.id, battleId);
        
        console.log(`Socket ${socket.id} joined battle ${battleId}`);
        
        // Notify others in battle
        socket.to(`battle:${battleId}`).emit('playerJoined', {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      });

      // Leave battle lobby
      socket.on('leaveBattleLobby', (data) => {
        const { battleId } = data;
        socket.leave(`battle:${battleId}`);
        this.battleSocketMap.delete(socket.id);
        
        socket.to(`battle:${battleId}`).emit('playerLeft', {
          socketId: socket.id,
          userId: socket.userId,
          timestamp: new Date()
        });
      });

      // Player ready status
      socket.on('playerReady', async (data) => {
        const { battleId, playerIndex } = data;
        
        this.io.to(`battle:${battleId}`).emit('playerReadyUpdate', {
          playerIndex,
          userId: socket.userId,
          username: socket.username,
          isReady: true
        });

        await this.checkAllPlayersReady(battleId);
      });

      // Start battle
      socket.on('startBattle', async (data) => {
        const { battleId } = data;
        try {
          const battle = await BattleService.startBattle(battleId);
          
          // Notify all players in battle
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
            currentRound: result.battle.currentRound,
            isComplete: result.isComplete
          });

          // If battle complete, send winner
          if (result.isComplete) {
            this.io.to(`battle:${battleId}`).emit('battleComplete', {
              battle: result.battle,
              winnerIndex: result.battle.winnerPlayerIndex,
              winnerPrize: result.battle.winnerPrize,
              winnerUserId: result.battle.winnerUserId
            });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        
        const userId = this.socketUserMap.get(socket.id);
        if (userId) {
          this.userSocketMap.delete(userId);
          this.socketUserMap.delete(socket.id);
        }
        
        const battleId = this.battleSocketMap.get(socket.id);
        if (battleId) {
          this.io.to(`battle:${battleId}`).emit('playerDisconnected', {
            socketId: socket.id,
            userId: userId,
            timestamp: new Date()
          });
          this.battleSocketMap.delete(socket.id);
        }
      });
    });
  }

  async checkAllPlayersReady(battleId) {
    // Implement logic to check if all players are ready
    // You can store ready status in battle document or in-memory
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

  // Broadcast battle creation to all users
  broadcastBattleCreated(battle) {
    this.io.emit('battleCreated', battle);
  }

  // Broadcast battle update
  broadcastBattleUpdated(battle) {
    this.io.emit('battleUpdated', battle);
  }

  // Broadcast battle started (remove from waiting list)
  broadcastBattleStarted(battleId) {
    this.io.emit('battleStarted', { battleId });
  }

  getIO() {
    return this.io;
  }
}

export default SocketService;