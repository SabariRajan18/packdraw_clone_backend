// services/adminService/user.service.js
import UsersModel from "../../models/Users.js";
import TransactionModel from "../../models/Transaction.js";

export default new class AdminUserService {
  getUsers = async (query = {}) => {
    try {
      const { page = 1, limit = 10, search = '' } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await UsersModel.find(filter, { password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await UsersModel.countDocuments(filter);

      return {
        code: 200,
        status: true,
        message: "Users retrieved successfully",
        data: {
          users,
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

  getUserById = async (userId) => {
    try {
      const user = await UsersModel.findById(userId, { password: 0 });
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found",
          data: null,
        };
      }

      return {
        code: 200,
        status: true,
        message: "User retrieved successfully",
        data: user,
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

  updateUser = async (userId, updateData) => {
    try {
      const user = await UsersModel.findById(userId);
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found",
          data: null,
        };
      }

      // Remove password from update data
      const { password, ...safeUpdateData } = updateData;
      
      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { $set: safeUpdateData },
        { new: true, select: { password: 0 } }
      );

      return {
        code: 200,
        status: true,
        message: "User updated successfully",
        data: updatedUser,
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

  toggleUserStatus = async (userId) => {
    try {
      const user = await UsersModel.findById(userId);
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found",
          data: null,
        };
      }

      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { $set: { isActive: !user.isActive } },
        { new: true, select: { password: 0 } }
      );

      return {
        code: 200,
        status: true,
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedUser,
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

  getUserTransactions = async (userId, query = {}) => {
    try {
      const { page = 1, limit = 10, type } = query;
      const skip = (page - 1) * limit;

      const filter = { userId };
      if (type) {
        filter.type = type;
      }

      const transactions = await TransactionModel.find(filter)
        .populate('userId', 'email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await TransactionModel.countDocuments(filter);

      return {
        code: 200,
        status: true,
        message: "Transactions retrieved successfully",
        data: {
          transactions,
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
}();