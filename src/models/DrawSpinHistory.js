import mongoose, { Schema } from "mongoose";

const DrawSpinHistorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    drawProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    rewardAmount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      default: "",
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "DrawSpinHistory" }
);

const DrawSpinHistoryModel = mongoose.model(
  "DrawSpinHistory",
  DrawSpinHistorySchema
);
export default DrawSpinHistoryModel;
