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
    amount: {
      type: Number,
      required: true,
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
