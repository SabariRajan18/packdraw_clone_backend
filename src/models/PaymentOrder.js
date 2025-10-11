import mongoose from "mongoose";
  
const NowPaymentsOrdersSchema = new mongoose.Schema({
    userid: {
        type: String
    },
    useremail: {
        type: String
    },
    payment_done_to_walletaddress: {
        type: String
    },
    txnhash: {
        type: String
    },
    type: {
        type: String
    },
    fee: {
        type: String
    },
    coin: {
        type: String
    },
    currency:{
        type: String 
    },
    amount: {
        type: Number
    },
    deposite_date: {
        type: Date
    },
    txnstatus: {
        type: String
    },
    token_balance_before: {
        type: Number
    },
    token_balance_after: {
        type: Number
    },
    mazi_chips_balance_before: {
        type: Number
    },
    mazi_chips_balance_after: {
        type: Number
    },
},
{
    timestamps: true 
}
)

const NowPaymentsOrders = new mongoose.model('now_payments_orders', NowPaymentsOrdersSchema);
export default NowPaymentsOrders;