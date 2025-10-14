import mongoose, { Schema } from "mongoose";

const packdrawSchema = new Schema(
  {
    name: { type: String, required: true },
    wallpaper: { type: String, requires: true },
    packAmount: { type: Number, required: true },
    creator: { type: String, default: "Admin", index: true }, //admin or user
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "PacksItems" }],
  },
  { timestamps: true, collection: "PackDraw" }
);

const PackDrawModel = mongoose.model("PackDraw", packdrawSchema);
export default PackDrawModel;
