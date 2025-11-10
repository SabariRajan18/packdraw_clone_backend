import mongoose, { Schema } from "mongoose";

const DealsSpinHistorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    rewardItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PacksItems",
    },
    amount: {
      type: Number,
      required: true,
    },
    outComePer: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, collection: "DealsSpinHistory" }
);

const DealsSpinHistoryModel = mongoose.model(
  "DealsSpinHistory",
  DealsSpinHistorySchema
);
export default DealsSpinHistoryModel;