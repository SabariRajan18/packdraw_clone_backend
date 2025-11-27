import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Config
dotenv.config();

// Import routes
import routes from './routes/index.js';

// Import socket handlers
import BattleHandler from './socket/battleHandler.js';

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Socket connection handling
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Register user with socket
  socket.on('register', (userId) => {
    socket.userId = userId;
    console.log(`🟡 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// Initialize battle handler
const battleHandler = new BattleHandler(io);
battleHandler.initialize();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/packdraw')
  .then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('🔴 MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };