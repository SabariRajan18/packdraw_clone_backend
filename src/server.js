import express from "express";
import routers from "./routes/index.js";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { setControllerSocket } from "./helpers/socket.helper.js";
import "./cron/battle.cron.js";
import { joinBattle, moniterBattles } from "./socket/battle.socket.js";
import DrawProductsModel from "./models/DrawProducts.js";

dotenv.config();
const app = express();
const { PORT } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setControllerSocket(io);
connectDB();

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("join-battle", async (battleConfig) => {
    await joinBattle(battleConfig);
  });

  socket.on("register", (userId) => {
    if (!userId) return;
    socket.join(userId.toString());
  });

  socket.on("moniter-battle-room", async (battleId) => {
    socket.join(battleId);
    await moniterBattles(io, battleId);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected!");
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// const data = [
//   {
//     "name": "Gold Coins 5",
//     "image": "/uploads/coins5.png",
//     "amount": 5,
//     "chance": 20,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Gold Coins 10",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 10,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Badge",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 15,
//     "chance": 10,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Try Again",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 0,
//     "chance": 40,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Bronze Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 12,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 50",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 50,
//     "chance": 10,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Magic Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 40,
//     "chance": 8,
//     "tier": "medium",
//     "stock": 20,
//     "status": true
//   },
//   {
//     "name": "Reward Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 30,
//     "chance": 12,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 60,
//     "chance": 6,
//     "tier": "medium",
//     "stock": 10,
//     "status": true
//   },
//   {
//     "name": "Energy Booster",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 35,
//     "chance": 14,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 100",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 100,
//     "chance": 5,
//     "tier": "hard",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Diamond Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 120,
//     "chance": 3,
//     "tier": "hard",
//     "stock": 5,
//     "status": true
//   },
//   {
//     "name": "Premium Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 150,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 3,
//     "status": true
//   },
//   {
//     "name": "Mega Reward Pack",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 200,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 2,
//     "status": true
//   },
//   {
//     "name": "Ruby Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 180,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 4,
//     "status": true
//   },

//   {
//     "name": "Silver Coins 20",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 20,
//     "chance": 18,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Golden Spin Ticket",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 70,
//     "chance": 7,
//     "tier": "medium",
//     "stock": 25,
//     "status": true
//   },
//   {
//     "name": "Lucky Card",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 25,
//     "chance": 16,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Treasure Key",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 55,
//     "chance": 9,
//     "tier": "medium",
//     "stock": 15,
//     "status": true
//   },
//   {
//     "name": "Black Diamond",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 250,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 1,
//     "status": true
//   },
//    {
//     "name": "Gold Coins 5",
//     "image": "/uploads/coins5.png",
//     "amount": 5,
//     "chance": 20,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Gold Coins 10",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 10,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Badge",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 15,
//     "chance": 10,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Try Again",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 0,
//     "chance": 40,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Bronze Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 12,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 50",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 50,
//     "chance": 10,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Magic Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 40,
//     "chance": 8,
//     "tier": "medium",
//     "stock": 20,
//     "status": true
//   },
//   {
//     "name": "Reward Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 30,
//     "chance": 12,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 60,
//     "chance": 6,
//     "tier": "medium",
//     "stock": 10,
//     "status": true
//   },
//   {
//     "name": "Energy Booster",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 35,
//     "chance": 14,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 100",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 100,
//     "chance": 5,
//     "tier": "hard",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Diamond Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 120,
//     "chance": 3,
//     "tier": "hard",
//     "stock": 5,
//     "status": true
//   },
//   {
//     "name": "Premium Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 150,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 3,
//     "status": true
//   },
//   {
//     "name": "Mega Reward Pack",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 200,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 2,
//     "status": true
//   },
//   {
//     "name": "Ruby Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 180,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 4,
//     "status": true
//   },

//   {
//     "name": "Silver Coins 20",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 20,
//     "chance": 18,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Golden Spin Ticket",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 70,
//     "chance": 7,
//     "tier": "medium",
//     "stock": 25,
//     "status": true
//   },
//   {
//     "name": "Lucky Card",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 25,
//     "chance": 16,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Treasure Key",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 55,
//     "chance": 9,
//     "tier": "medium",
//     "stock": 15,
//     "status": true
//   },
//   {
//     "name": "Black Diamond",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 250,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 1,
//     "status": true
//   },
//    {
//     "name": "Gold Coins 5",
//     "image": "/uploads/coins5.png",
//     "amount": 5,
//     "chance": 20,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Gold Coins 10",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 10,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Badge",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 15,
//     "chance": 10,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Try Again",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 0,
//     "chance": 40,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Bronze Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 12,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 50",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 50,
//     "chance": 10,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Magic Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 40,
//     "chance": 8,
//     "tier": "medium",
//     "stock": 20,
//     "status": true
//   },
//   {
//     "name": "Reward Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 30,
//     "chance": 12,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 60,
//     "chance": 6,
//     "tier": "medium",
//     "stock": 10,
//     "status": true
//   },
//   {
//     "name": "Energy Booster",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 35,
//     "chance": 14,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 100",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 100,
//     "chance": 5,
//     "tier": "hard",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Diamond Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 120,
//     "chance": 3,
//     "tier": "hard",
//     "stock": 5,
//     "status": true
//   },
//   {
//     "name": "Premium Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 150,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 3,
//     "status": true
//   },
//   {
//     "name": "Mega Reward Pack",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 200,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 2,
//     "status": true
//   },
//   {
//     "name": "Ruby Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 180,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 4,
//     "status": true
//   },

//   {
//     "name": "Silver Coins 20",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 20,
//     "chance": 18,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Golden Spin Ticket",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 70,
//     "chance": 7,
//     "tier": "medium",
//     "stock": 25,
//     "status": true
//   },
//   {
//     "name": "Lucky Card",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 25,
//     "chance": 16,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Treasure Key",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 55,
//     "chance": 9,
//     "tier": "medium",
//     "stock": 15,
//     "status": true
//   },
//   {
//     "name": "Black Diamond",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 250,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 1,
//     "status": true
//   },
//    {
//     "name": "Gold Coins 5",
//     "image": "/uploads/coins5.png",
//     "amount": 5,
//     "chance": 20,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Gold Coins 10",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 10,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Badge",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 15,
//     "chance": 10,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Try Again",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 0,
//     "chance": 40,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Bronze Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 12,
//     "chance": 15,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 50",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 50,
//     "chance": 10,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Magic Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 40,
//     "chance": 8,
//     "tier": "medium",
//     "stock": 20,
//     "status": true
//   },
//   {
//     "name": "Reward Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 30,
//     "chance": 12,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Silver Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 60,
//     "chance": 6,
//     "tier": "medium",
//     "stock": 10,
//     "status": true
//   },
//   {
//     "name": "Energy Booster",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 35,
//     "chance": 14,
//     "tier": "medium",
//     "stock": -1,
//     "status": true
//   },

//   {
//     "name": "Gold Coins 100",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 100,
//     "chance": 5,
//     "tier": "hard",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Diamond Box",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 120,
//     "chance": 3,
//     "tier": "hard",
//     "stock": 5,
//     "status": true
//   },
//   {
//     "name": "Premium Spin",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 150,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 3,
//     "status": true
//   },
//   {
//     "name": "Mega Reward Pack",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 200,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 2,
//     "status": true
//   },
//   {
//     "name": "Ruby Chest",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 180,
//     "chance": 2,
//     "tier": "hard",
//     "stock": 4,
//     "status": true
//   },

//   {
//     "name": "Silver Coins 20",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 20,
//     "chance": 18,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Golden Spin Ticket",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 70,
//     "chance": 7,
//     "tier": "medium",
//     "stock": 25,
//     "status": true
//   },
//   {
//     "name": "Lucky Card",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 25,
//     "chance": 16,
//     "tier": "easy",
//     "stock": -1,
//     "status": true
//   },
//   {
//     "name": "Treasure Key",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 55,
//     "chance": 9,
//     "tier": "medium",
//     "stock": 15,
//     "status": true
//   },
//   {
//     "name": "Black Diamond",
//     "image": "https://res.cloudinary.com/dvnypanys/image/upload/v1764134121/demo_ojmz9q.webp",
//     "amount": 250,
//     "chance": 1,
//     "tier": "hard",
//     "stock": 1,
//     "status": true
//   }
// ];

// DrawProductsModel.insertMany(data)


app.use("/api", routers);

server.listen(PORT, () => {
  console.log(`🚀 Server & Socket running at http://localhost:${PORT}`);
});
