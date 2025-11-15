// socket/socketManager.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.battleRooms = new Map(); // battleId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
      }
    });

    this.io.use(this.authenticateSocket);
    this.io.on('connection', this.handleConnection.bind(this));
  }

  authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  }

  handleConnection(socket) {
    console.log(`User ${socket.userId} connected: ${socket.id}`);
    
    // Store user connection
    this.connectedUsers.set(socket.userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Battle event handlers
    socket.on('join_battle', (data) => this.handleJoinBattle(socket, data));
    socket.on('leave_battle', (data) => this.handleLeaveBattle(socket, data));
    socket.on('start_battle', (data) => this.handleStartBattle(socket, data));
    socket.on('open_pack', (data) => this.handleOpenPack(socket, data));
    socket.on('battle_chat', (data) => this.handleBattleChat(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  handleDisconnect(socket) {
    this.connectedUsers.delete(socket.userId);
    console.log(`User ${socket.userId} disconnected`);
  }
}

export default new SocketManager();