import mongoose, { Schema } from "mongoose";
const BattleModel = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    battleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battles",
    },
    battleAmount: {
      type: Number,
      required: true,
    },
    rewardItemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PacksItems",
      },
    ],
    totalRewardAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "BattleHistory" }
);

const BattleHistoryModel = mongoose.model("BattleHistory", BattleModel);
export default BattleHistoryModel;
