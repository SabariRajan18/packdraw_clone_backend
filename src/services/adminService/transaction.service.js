// services/adminService/transaction.service.js
import TransactionModel from "../../models/PaymentOrder.js";
import UsersModel from "../../models/Users.js";

export default new class AdminTransactionService {
  getTransactions = async (query = {}) => {
    try {
      const { page = 1, limit = 10, type, status, search } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      if (search) {
        const users = await UsersModel.find({
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        filter.userId = { $in: users.map(user => user._id) };
      }

      const transactions = await TransactionModel.find(filter)
        .populate('userId', 'email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await TransactionModel.countDocuments(filter);

      // Calculate totals
      const depositTotal = await TransactionModel.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const withdrawalTotal = await TransactionModel.aggregate([
        { $match: { type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        code: 200,
        status: true,
        message: "Transactions retrieved successfully",
        data: {
          transactions,
          totals: {
            deposits: depositTotal[0]?.total || 0,
            withdrawals: withdrawalTotal[0]?.total || 0
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
      };
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  getDeposits = async (query = {}) => {
    try {
      const response = await this.getTransactions({ ...query, type: 'deposit' });
      return response;
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  getWithdrawals = async (query = {}) => {
    try {
      const response = await this.getTransactions({ ...query, type: 'withdrawal' });
      return response;
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  updateTransactionStatus = async (transactionId, status) => {
    try {
      const transaction = await TransactionModel.findById(transactionId);
      if (!transaction) {
        return {
          code: 404,
          status: false,
          message: "Transaction not found",
          data: null,
        };
      }

      // Update user balance if completing deposit or withdrawal
      if (status === 'completed' && transaction.status !== 'completed') {
        const user = await UsersModel.findById(transaction.userId);
        if (user) {
          if (transaction.type === 'deposit') {
            user.balance += transaction.amount;
          } else if (transaction.type === 'withdrawal') {
            user.balance -= transaction.amount;
          }
          await user.save();
        }
      }

      // Revert balance if cancelling completed transaction
      if (status === 'cancelled' && transaction.status === 'completed') {
        const user = await UsersModel.findById(transaction.userId);
        if (user) {
          if (transaction.type === 'deposit') {
            user.balance -= transaction.amount;
          } else if (transaction.type === 'withdrawal') {
            user.balance += transaction.amount;
          }
          await user.save();
        }
      }

      const updatedTransaction = await TransactionModel.findByIdAndUpdate(
        transactionId,
        { $set: { status } },
        { new: true }
      ).populate('userId', 'email username');

      return {
        code: 200,
        status: true,
        message: "Transaction status updated successfully",
        data: updatedTransaction,
      };
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  getDashboardStats = async () => {
    try {
      const totalUsers = await UsersModel.countDocuments();
      const totalPacks = await PackDrawModel.countDocuments();
      
      const revenueStats = await TransactionModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { 
          _id: '$type', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }}
      ]);

      const deposits = revenueStats.find(stat => stat._id === 'deposit');
      const withdrawals = revenueStats.find(stat => stat._id === 'withdrawal');

      return {
        code: 200,
        status: true,
        message: "Dashboard stats retrieved successfully",
        data: {
          totalUsers,
          totalPacks,
          totalDeposits: deposits?.total || 0,
          totalWithdrawals: withdrawals?.total || 0,
          totalRevenue: (deposits?.total || 0) - (withdrawals?.total || 0)
        },
      };
    } catch (error) {
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}();