import mongoose from "mongoose";

const WithdrawalHistorySchema = new mongoose.Schema(
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
    game_chip_used: {
      type: Number,
    },
    game_chip_balance_before_withdraw: {
      type: Number,
    },
    game_chip_balance_after_withdraw: {
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
    withdraw_amount_in_usd: {
      type: Number,
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
    transactionHash: {
      type: String,
      default: "In progress",
    },
  },
  {
    timestamps: true,
    collection: "WithdrawalHistory",
  }
);

const WithdrawalHistory = new mongoose.model(
  "WithdrawalHistory",
  WithdrawalHistorySchema
);
export default WithdrawalHistory;
