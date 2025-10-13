const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const NowPaymentsOrdersHistorySchema = new mongoose.Schema(
  {
    userid: {
      type: String,
    },
    useremail: {
      type: String,
    },
    payment_done_to_walletaddress: {
      type: String,
    },
    txnhash: {
      type: String,
    },
    type: {
      type: String,
    },
    fee: {
      type: String,
    },
    coin: {
      type: String,
    },
    amount: {
      type: Double,
    },
    deposite_date: {
      type: Date,
    },
    txnstatus: {
      type: String,
    },
    token_balance_before: {
      type: Double,
    },
    token_balance_after: {
      type: Double,
    },
    chips_balance_before: {
      type: Double,
    },
    chips_balance_after: {
      type: Double,
    },
  },
  {
    timestamps: true,
    collection: "now_payments_orders_history",
  }
);

const NowPaymentsOrdersHistory = new mongoose.model(
  "now_payments_orders_history",
  NowPaymentsOrdersHistorySchema
);
export default NowPaymentsOrdersHistory;
