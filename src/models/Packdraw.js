import mongoose, { Schema } from "mongoose";

const packdrawSchema = new Schema(
  {
    name: { type: String, required: true },
    wallpaper: { type: mongoose.Schema.Types.ObjectId, requires: true, ref: "PacksImages" },
    packAmount: { type: Number, required: true },
    creator: { type: String, default: "Admin", index: true }, //Admin or User
    creatorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    outCome: { type: Number, default: 0.00001 },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "PacksItems" }],
  },
  { timestamps: true, collection: "PackDraw" }
);

const PackDrawModel = mongoose.model("PackDraw", packdrawSchema);
export default PackDrawModel;
