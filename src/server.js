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
import battleRoutes  from './routes/battleroutes.js'
import socketService from "./services/socketService.js";

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


app.use("/api", routers);
app.use('/api/battles', battleRoutes);


server.listen(PORT, () => {
  console.log(`🚀 Server & Socket running at http://localhost:${PORT}`);
});
 new socketService(server);

export { app, server };