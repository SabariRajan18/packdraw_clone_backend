import mongoose, { Schema } from "mongoose";

const verifyUserSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    otp: { type: Number, default: 0 },
    type: { type: String, default: "register" },
    otpExpireAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "VerifyUsers",
  }
);

const VerifyUsersModel = mongoose.model("VerifyUsers", verifyUserSchema);
export default VerifyUsersModel;
