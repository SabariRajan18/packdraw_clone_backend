import mongoose, { Schema } from "mongoose";

const packdrawSchema = new Schema(
  {
    name: { type: String, required: true },
    wallpaper: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PacksImages",
    },
    packAmount: { type: Number, required: true },
    creator: { type: String, default: "Admin", index: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    outCome: { type: Number, default: 0.00001 },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "PacksItems" }],
    rareMultiPlayer: { type: Number, default: 10 },
    epicMultiPlayer: { type: Number, default: 20 },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "PackDraw" }
);

export default mongoose.models.PackDraw ||
  mongoose.model("PackDraw", packdrawSchema);
