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
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use("/api", routers);
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
