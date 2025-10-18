import mongoose, { Schema } from "mongoose";

const PacksImagesSchema = new Schema(
  {
    wallpaper: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "PacksImages" }
);

const PacksImagesModel = mongoose.model("PacksImages", PacksImagesSchema);
export default PacksImagesModel;
