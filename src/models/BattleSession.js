import mongoose, { Schema } from "mongoose";

const battleSessionSchema = new Schema({
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Battles",
    required: true,
    unique: true,
    index: true
  },
  round: { type: Number, default: 1 },
  packOpenings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", index: true },
    username: String,
    round: { type: Number, index: true },
    packIndex: Number,
    items: [{
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "PacksItems" },
      name: String,
      value: Number,
      rarity: String,
      image: String,
      revealed: { type: Boolean, default: false }
    }],
    totalValue: Number,
    openedAt: { type: Date, default: Date.now }
  }],
  playerStats: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    username: String,
    totalValue: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    lastPackValue: { type: Number, default: 0 },
    chances: { type: Number, default: 0 },
    roundsWon: { type: Number, default: 0 },
    color: String // For UI representation
  }],
  jackpotPool: { type: Number, default: 0 },
  roundWinners: [{
    round: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    username: String,
    prizeValue: Number,
    pointsAwarded: Number
  }],
  isCompleted: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// TTL index for session cleanup
battleSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 * 6 }); // 6 hours

export default mongoose.model("BattleSession", battleSessionSchema);