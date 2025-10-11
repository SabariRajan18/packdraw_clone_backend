import mongoose from "mongoose";

const UserNotificationsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userdatas",
    },
    notificationtype: {
      type: String, //deposit, withdraw, admin
    },
    has_image: {
      type: Boolean,
      default: false,
    },
    image_url: {
      type: String,
      default: "",
    },
    has_link: {
      type: Boolean,
      default: false,
    },
    link_url: {
      type: String,
      default: "",
    },
    notification_title: {
      type: String,
    },
    message: {
      type: String,
    },
    notificationdate: {
      type: Date,
      default: Date.now,
    },
    viewstatus: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserNotifications = new mongoose.model(
  "UserNotifications",
  UserNotificationsSchema
);
export default UserNotifications;
