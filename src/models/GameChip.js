import mongoose from "mongoose";

const GameChipSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    user_table_key: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userdatas",
    },
    total_chip_amount: {
      type: Number, // total balance
      default: 0,
    },
    crypto_balances: {
      btc: { type: Number, default: 0 },
      usdterc20: { type: Number, default: 0 },
      ltc: { type: Number, default: 0 },
      doge: { type: Number, default: 0 },
      trx: { type: Number, default: 0 },
      xrp: { type: Number, default: 0 },
      eth: { type: Number, default: 0 },
      usdc: { type: Number, default: 0 },
    },
    last_updated: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: true,
    collection: "GameChip",
  }
);

const GameChip = mongoose.model("GameChip", GameChipSchema);
export default GameChip;
