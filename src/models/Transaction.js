// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'stripe' // or 'paypal', 'crypto', etc.
  },
  transactionId: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Generate transaction ID before saving
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const prefix = this.type === 'deposit' ? 'DEP' : 'WITH';
    this.transactionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;