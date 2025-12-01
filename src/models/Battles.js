import mongoose from "mongoose";

// models/Battle.js
const Schema = mongoose.Schema;

const battlePlayerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isBot: { type: Boolean, default: false },
  username: { type: String, required: true },
  socketId: { type: String },
  seatIndex: { type: Number, required: true },
  totalValue: { type: Number, default: 0 },
  lastPrizeValue: { type: Number, default: 0 },
  pointRushScore: { type: Number, default: 0 },
  prizes: [{
    packId: { type: Schema.Types.ObjectId, ref: 'PackDraw' },
    roundIndex: { type: Number },
    itemId: { type: Schema.Types.ObjectId, ref: 'PacksItems' },
    value: { type: Number },
    name: { type: String },
    rarity: { type: String },
    image: { type: String }
  }],
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const battleSchema = new Schema({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  creatorType: {
    type: String,
    default: ""
  },
  name: {
    type: String,
    default: ""
  },
  battleType: {
    type: String,
    required: true,
    enum: ['SOLO', 'TEAM']
  },
  playersCount: {
    type: Number,
    required: true
  },
  gameMode: {
    type: String,
    required: true,
    enum: [
      'NORMAL',
      'JACKPOT',
      'LAST_CHANCE_JACKPOT',
      'UPSIDE_DOWN_JACKPOT',
      'UPSIDE_DOWN_NORMAL',
      'UPSIDE_DOWN_POINT_RUSH',
      'LAST_CHANCE_NORMAL',
      'LAST_CHANCE_UPSIDE_DOWN_NORMAL',
      'SHARED'
    ]
  },
  battleGameMode: {
    type: String,
    required: true
  },
  packsIds: [{
    type: Schema.Types.ObjectId,
    ref: 'PackDraw',
    required: true
  }],
  battleAmount: {
    type: Number,
    required: true,
    default: 0
  },
  battleOptions: {
    fastBattle: { type: Boolean, default: false },
    lastChance: { type: Boolean, default: false },
    upsideDown: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['Waiting', 'Running', 'Completed', 'Cancelled'],
    default: 'Waiting'
  },
  currentRound: {
    type: Number,
    default: 0
  },
  totalRounds: {
    type: Number,
    required: true
  },
  jackpotPool: {
    type: Number,
    default: 0
  },
  players: [battlePlayerSchema],
  winnerPlayerIndex: { type: Number, default: null },
  winnerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  winnerPrize: { type: Number, default: 0 },
  finishedAt: { type: Date, default: null },
  isPrivate: { type: Boolean, default: false },
  entryFee: { type: Number, default: 0 },
  minPlayers: { type: Number, default: 2 },
  maxPlayers: { type: Number, default: 4 }
}, {
  collection: 'Battles',
  timestamps: true
});

// Indexes
battleSchema.index({ status: 1 });
battleSchema.index({ creatorId: 1 });
battleSchema.index({ createdAt: -1 });

const Battle = mongoose.model('Battles', battleSchema);
export default  Battle;