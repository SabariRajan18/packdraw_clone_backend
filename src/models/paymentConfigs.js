import mongoose from "mongoose";

const PaymentConfigsSchema = new mongoose.Schema(
  {
    minChipsWithdraw: {
      type: Number,
    },
    maxChipsWithdraw: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection:"PaymentConfigs"
  }
);

const PaymentConfigs = new mongoose.model("PaymentConfigs", PaymentConfigsSchema);
export default PaymentConfigs;