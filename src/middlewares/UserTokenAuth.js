import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mySecretKey";

export const userTokenAuth = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    res
      .status(401)
      .json({ message: "Authorization Admin token missing or malformed" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // console.error({ error });
    res.status(403).json({ message: "Invalid or expired token" });
    return;
  }
};
export const userTokenAuthuser = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token missing or malformed" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ✅ now your controller can do const { userId } = req.user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
