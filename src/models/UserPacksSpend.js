import mongoose, { Schema } from "mongoose";

const PacksSpendSchema = new Schema(
  {
    packsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackDraw",
    },
    totalSpends: {
      type: Number,
      default: 0,
    },
    isRareReached: {
      type: Boolean,
      default: false,
    },
    isEpicReached: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "PacksSpend", timestamps: true }
);

const PacksSpendModel = mongoose.model("PacksSpend", PacksSpendSchema);

export default PacksSpendModel;