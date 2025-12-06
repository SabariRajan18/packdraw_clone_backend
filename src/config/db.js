import mongoose from "mongoose";
import dotenv from "dotenv";
import CronScheduler from "../cron/scheduler.js"
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Homam";
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully");
    CronScheduler.init();

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
