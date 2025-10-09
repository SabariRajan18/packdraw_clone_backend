import express from "express";
import routers from "./routes/index.js";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url"; 
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const { PORT } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();
app.use(express.json());
app.use(cookieParser());

app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(express.static(path.join(__dirname, "../public")));
app.use("/api", routers);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});