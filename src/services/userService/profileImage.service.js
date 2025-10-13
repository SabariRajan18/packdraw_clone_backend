// services/userService/profileImage.service.js
import UsersModel from "../../models/Users.js";
import { uploadImage } from "../../config/cloudinary.js";

export default new class ProfileImageService {
  uploadProfileImage = async (userId, file) => {
    console.log('userId, file :>> ', userId, file);
    try {
      if (!file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
          code: 400,
          status: false,
          message: "Invalid file type. Only JPEG, JPG, PNG, and WEBP are allowed.",
          data: null,
        };
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          code: 400,
          status: false,
          message: "File size too large. Maximum size is 5MB.",
          data: null,
        };
      }

      // Check if user exists
      const user = await UsersModel.findById(userId);
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found!",
          data: null,
        };
      }

      // Generate unique filename
      const filename = `profile_${userId}_${Date.now()}`;
      
      // Upload image to Cloudinary
      const imageUrl = await uploadImage(file.buffer, filename);

      // Update user's profile image in database
      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            profileImage: imageUrl,
            updatedAt: new Date()
          } 
        },
        { new: true, select: '-password' } // Return updated user without password
      );

      return {
        code: 200,
        status: true,
        message: "Profile image uploaded successfully!",
        data: {
          profileImage: imageUrl,
          user: updatedUser
        },
      };
    } catch (error) {
      console.error("Profile Image Upload Error:", error);
      
      // Handle Cloudinary specific errors
      if (error.message.includes('File size too large')) {
        return {
          code: 400,
          status: false,
          message: "File size too large for upload service.",
          data: null,
        };
      }
      
      if (error.message.includes('Invalid image file')) {
        return {
          code: 400,
          status: false,
          message: "Invalid image file format.",
          data: null,
        };
      }

      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  // Optional: Delete profile image
  deleteProfileImage = async (userId) => {
    try {
      const user = await UsersModel.findById(userId);
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found!",
          data: null,
        };
      }

      if (!user.profileImage) {
        return {
          code: 400,
          status: false,
          message: "No profile image to delete!",
          data: null,
        };
      }

      // Update user to remove profile image
      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { 
          $unset: { profileImage: 1 },
          $set: { updatedAt: new Date() }
        },
        { new: true, select: '-password' }
      );

      return {
        code: 200,
        status: true,
        message: "Profile image removed successfully!",
        data: {
          user: updatedUser
        },
      };
    } catch (error) {
      console.error("Delete Profile Image Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  // Optional: Get user profile with image
  getUserProfile = async (userId) => {
    try {
      const user = await UsersModel.findById(userId).select('-password');
      if (!user) {
        return {
          code: 404,
          status: false,
          message: "User not found!",
          data: null,
        };
      }

      return {
        code: 200,
        status: true,
        message: "User profile retrieved successfully!",
        data: user,
      };
    } catch (error) {
      console.error("Get User Profile Error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}();