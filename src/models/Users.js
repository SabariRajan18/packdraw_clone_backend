import mongoose, { Schema } from "mongoose";

const usersSchema = new Schema(
  {
    userName: { type: String },
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
    isGoogleAct: { type: Boolean, default: false },
    authCode: { type: Number, default: 0 },
    authSecret: { type: String, default: "" },
    authExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const UsersModel = mongoose.model("Users", usersSchema);
export default UsersModel;
