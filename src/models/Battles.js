import mongoose, { Schema } from "mongoose";

const battleSchema = new Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    creatorType: {
      type: String,
      default: "user",
    },
    name: {
      type: String,
      default: "",
    },
    battleType: {
      type: String,
      required: true,
      enum: ['solo', 'team'],
      index: true
    },
    teamFormat: {
      type: String,
      enum: ['1v1', '2v2', '3v3', '4v4', '2v2v2', null],
      default: null
    },
    players: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      username: { type: String, required: true },
      team: { type: String, default: null },
      joinedAt: { type: Date, default: Date.now },
      isBot: { type: Boolean, default: false },
      botDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
      avatar: String,
      ready: { type: Boolean, default: false },
      socketId: String
    }],
    battleGameMode: {
      type: String,
      required: true,
      enum: ['normal', 'jackpot', 'pointRush', 'lastChance', 'shared', 'upsideDown'],
      index: true
    },
    battleAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    battleOptions: {
      fastBattle: { type: Boolean, default: false },
      lastChance: { type: Boolean, default: false },
      upsideDown: { type: Boolean, default: false },
    },
    packsPerPlayer: { type: Number, default: 1, enum: [1, 2] },
    packsIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "PackDraw", index: true }],
    rounds: { type: Number, default: 1, min: 1, max: 50 },
    currentRound: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['waiting', 'countdown', 'active', 'completed', 'cancelled'],
      default: "waiting",
      index: true
    },
    settings: {
      maxPlayers: { type: Number, default: 2, min: 2, max: 8 },
      entryFee: { type: Number, default: 0, min: 0 },
      prizePool: { type: Number, default: 0 }
    },
    results: {
      winner: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      winningTeam: String,
      prizeDistribution: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        username: String,
        prizeValue: Number,
        share: Number,
        points: Number,
        position: Number
      }],
      totalPrize: Number,
      winnerPrize: Number,
      jackpotPool: Number
    },
    startedAt: { type: Date, index: true },
    completedAt: { type: Date, index: true },
    unboxedAmount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    collection: "Battles"
  }
);

// Indexes for performance
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ "players.userId": 1, status: 1 });
battleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 30 }); // Auto-delete after 30 days

export default mongoose.model("Battles", battleSchema);