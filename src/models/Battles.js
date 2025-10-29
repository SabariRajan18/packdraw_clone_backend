import mongoose, { Schema } from "mongoose";
const battleSchema = new Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    creatorType: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    battleType: {
      type: String,
      required: true,
    },
    players: {
      type: String,
      required: true,
    },
    battleGameMode: {
      type: String,
      required: true,
    },
    battleAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    battleOptions: {
      fastBattle: {
        type: Boolean,
        default: false,
      },
      lastChance: {
        type: Boolean,
        default: false,
      },
      upsideDown: {
        type: Boolean,
        default: false,
      },
    },
    packsIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "PackDraw" }],
    status: {
      type: String,
      default: "Waiting", // Played Completed
    },
  },
  { collection: "Battles", timestamps: true }
);

const BattleModel = mongoose.model("Battles", battleSchema);
export default BattleModel;
