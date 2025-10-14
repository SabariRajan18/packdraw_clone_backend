import mongoose, { Schema } from "mongoose";

const itemsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, collection: "PacksItems" }
);

const PacksItemsModel = mongoose.model("PacksItems", itemsSchema);
export default PacksItemsModel;
