import mongoose from "mongoose";

const TempWithdrawalHistorySchema = new mongoose.Schema(
  {
    userid: {
      type: String,
    },
    type_of_withdraw: {
      type: String,
    },
    withdrawal_chain: {
      type: String,
    },
    is_auto_withdrawal: {
      type: String,
      default: false,
    },
    withdraw_amount: {
      type: Number,
    },
    estimated_gas_fee: {
      type: Number,
    },
    approx_withdraw_amount: {
      type: Number,
    },
    requestid: {
      type: String,
    },
    confirmation_otp: {
      type: String,
    },
    withdrawl_address: {
      type: String,
    },
    withdraw_status: {
      type: String,
      default: "pending", // pending or completed
    },
    is_request_processed: {
      type: Boolean,
      default: false,
    },
    request_count: {
      type: Number,
      default: 0,
    },
    data_by_user: {
      type: Object,
    },
  },
  {
    timestamps: true,
    collection: "TempWithdrawalHistory",
  }
);

const TempWithdrawalHistory = new mongoose.model(
  "TempWithdrawalHistory",
  TempWithdrawalHistorySchema
);
export default TempWithdrawalHistory;
