import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    chance: {
      type: Number,
      required: true,
    },

    tier: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "low",
    },
    status: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "DrawProducts" }
);

const DrawProductsModel = mongoose.model("DrawProducts", productSchema);
export default DrawProductsModel;
