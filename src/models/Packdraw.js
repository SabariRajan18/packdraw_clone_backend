import mongoose, { Schema } from "mongoose";

const packdrawSchema = new Schema({
  wallpaper: { type: String, requires: true },
  packAmount: { type: Number, required: true },
  creator: { type: String, default: "Admin", index: true }, //admin or user
  items: [{ type: mongoose.Schema.Types.ObjectId }],
});

const PackDrawModel = mongoose.model("PackDraw", packdrawSchema);
export default PackDrawModel;
