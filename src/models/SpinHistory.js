import mongoose, { Schema } from "mongoose";

const SpinHistorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    packsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackDraw",
      required: true,
    },
    spinAmount: {
      type: Number,
      required: true,
    },
    rewardItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PacksItems",
      required: true,
    },
    rewardAmount: {
      type: Number,
      required: true,
    },
  },
  { collection: "SpinHistory", timestamps: true }
);

const SpinHistoryModel = mongoose.model("SpinHistory", SpinHistorySchema);
export default SpinHistoryModel;
