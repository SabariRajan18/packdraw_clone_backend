// middlewares/AdminTokenAuth.js
import jwt from "jsonwebtoken";
import AdminModel from "../models/Admins.js";

export const adminTokenAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        status: false,
        message: "Access denied. No token provided.",
        data: null,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        code: 403,
        status: false,
        message: "Invalid token type.",
        data: null,
      });
    }

    const admin = await AdminModel.findById(decoded.userId).select("-password");
    if (!admin) {
      return res.status(401).json({
        code: 401,
        status: false,
        message: "Invalid token.",
        data: null,
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        code: 401,
        status: false,
        message: "Admin account is deactivated.",
        data: null,
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      status: false,
      message: "Invalid token.",
      data: null,
    });
  }
};