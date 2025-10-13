// services/adminService/auth.service.js
import AdminModel from "../../models/Admins.js";
import { _EncPassword, _DecPassword, genAuthToken } from "../../helpers/common.helper.js";

export default new class AdminAuthService {
  login = async (credentials) => {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        return {
          code: 400,
          status: false,
          message: "Email and password are required",
          data: null,
        };
      }

      const admin = await AdminModel.findOne({ email });
      if (!admin) {
        return {
          code: 403,
          status: false,
          message: "Invalid credentials!",
          data: null,
        };
      }

      if (password !== _DecPassword(admin.password)) {
        return {
          code: 403,
          status: false,
          message: "Invalid credentials!",
          data: null,
        };
      }

      const authToken = genAuthToken(admin._id, 'admin');
      
      // Update last login
      await AdminModel.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

      return {
        code: 200,
        status: true,
        message: "Login successful!",
        data: {
          ...admin.toObject(),
          authToken,
          password: undefined
        },
      };
    } catch (error) {
      console.error("Admin Login Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  createAdmin = async (adminData) => {
    try {
      const { email, password, name, role } = adminData;

      if (!email || !password || !name) {
        return {
          code: 400,
          status: false,
          message: "All fields are required",
          data: null,
        };
      }

      const existingAdmin = await AdminModel.findOne({ email });
      if (existingAdmin) {
        return {
          code: 400,
          status: false,
          message: "Admin with this email already exists",
          data: null,
        };
      }

      const encryptedPassword = _EncPassword(password);
      const newAdmin = new AdminModel({
        email,
        password: encryptedPassword,
        name,
        role: role || 'admin'
      });

      await newAdmin.save();

      return {
        code: 201,
        status: true,
        message: "Admin created successfully",
        data: {
          ...newAdmin.toObject(),
          password: undefined
        },
      };
    } catch (error) {
      console.error("Create Admin Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  getAdmins = async () => {
    try {
      const admins = await AdminModel.find({}, { password: 0 });
      return {
        code: 200,
        status: true,
        message: "Admins retrieved successfully",
        data: admins,
      };
    } catch (error) {
      console.error("Get Admins Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  getAdminById = async (adminId) => {
    try {
      const admin = await AdminModel.findById(adminId, { password: 0 });
      if (!admin) {
        return {
          code: 404,
          status: false,
          message: "Admin not found",
          data: null,
        };
      }

      return {
        code: 200,
        status: true,
        message: "Admin retrieved successfully",
        data: admin,
      };
    } catch (error) {
      console.error("Get Admin Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  updateAdmin = async (adminId, updateData) => {
    try {
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return {
          code: 404,
          status: false,
          message: "Admin not found",
          data: null,
        };
      }

      // Remove password from update data
      const { password, ...safeUpdateData } = updateData;
      
      const updatedAdmin = await AdminModel.findByIdAndUpdate(
        adminId,
        { $set: safeUpdateData },
        { new: true, select: { password: 0 } }
      );

      return {
        code: 200,
        status: true,
        message: "Admin updated successfully",
        data: updatedAdmin,
      };
    } catch (error) {
      console.error("Update Admin Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  updateAdminPassword = async (adminId, passwordData) => {
    try {
      const { currentPassword, newPassword } = passwordData;
      
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return {
          code: 404,
          status: false,
          message: "Admin not found",
          data: null,
        };
      }

      // Verify current password
      if (currentPassword !== _DecPassword(admin.password)) {
        return {
          code: 400,
          status: false,
          message: "Current password is incorrect",
          data: null,
        };
      }

      // Update password
      const encryptedNewPassword = _EncPassword(newPassword);
      await AdminModel.findByIdAndUpdate(adminId, { 
        $set: { password: encryptedNewPassword } 
      });

      return {
        code: 200,
        status: true,
        message: "Password updated successfully",
        data: null,
      };
    } catch (error) {
      console.error("Update Admin Password Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  deleteAdmin = async (adminId) => {
    try {
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return {
          code: 404,
          status: false,
          message: "Admin not found",
          data: null,
        };
      }

      // Prevent deleting own account
      // You might want to add additional checks here

      await AdminModel.findByIdAndDelete(adminId);

      return {
        code: 200,
        status: true,
        message: "Admin deleted successfully",
        data: null,
      };
    } catch (error) {
      console.error("Delete Admin Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}();