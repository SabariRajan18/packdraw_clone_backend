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
import battleRoutes from "./routes/battleroutes.js";
import socketService from "./services/socketService.js";
dotenv.config();
const PORT = process.env.PORT;
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});
new socketService(io);
setControllerSocket(io);
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api", routers);
app.use("/api/battles", battleRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { app, server };
