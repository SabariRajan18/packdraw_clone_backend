import mongoose, { Schema } from "mongoose";

const usersSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
    isGoogleAct: { type: Boolean, default: false },
    authCode: { type: Number, default: 0 },
    authSecret: { type: String, default: "" },
    authExpiry: { type: Date, default: null },
    isBasicInfo: { type: Boolean, default: false },
    userName: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    isPersonalInfo: { type: Boolean, default: false },
    age: { type: String, default: "" },
    date_of_birth: { type: String, default: "" },
    lane_one: { type: String, default: "" },
    lane_two: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postcode: { type: String, default: "" },
    country: { type: String, default: "" },
    phone_number: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const UsersModel = mongoose.model("Users", usersSchema);
export default UsersModel;
