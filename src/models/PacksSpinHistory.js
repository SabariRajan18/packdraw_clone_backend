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
    type: {
      type: String,
      default: "",
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
    isClaimed: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "PacksSpinHistory", timestamps: true }
);

const SpinHistoryModel = mongoose.model("PacksSpinHistory", SpinHistorySchema);
export default SpinHistoryModel;
