import mongoose, { Document, Schema } from "mongoose";

const adminSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "Admin",
  }
);

const AdminModel = mongoose.model("Admin", adminSchema);
export default AdminModel;
