import speakeasy from "speakeasy";
import qrcode from "qrcode";

import UsersModel from "../../models/Users.js";
import VerifyUsersModel from "../../models/VerifyUser.js";
import {
  _EncPassword,
  _DecPassword,
  genOtp,
  verify2FA,
  genAuthToken,
} from "../../helpers/common.helper.js";
import sendMailer from "../../helpers/mail.helper.js";
class UserAuthService {
  register = async (req_Body) => {
    try {
      const { email, password, otp } = req_Body;

      if (!email || !password) {
        return {
          code: 400,
          status: false,
          message: "Email and password are required",
          data: null,
        };
      }
      const existUser = await UsersModel.findOne({ email });
      if (existUser) {
        return {
          code: 403,
          status: false,
          message: "E-Mail already exists!",
          data: null,
        };
      }
      const isVerifyUser = await VerifyUsersModel.findOne({ email });
      if (!isVerifyUser) {
        const otp = genOtp();
        await VerifyUsersModel.create({
          email,
          otp,
          type: "register",
          otpExpireAt: Date.now() + 5 * 60 * 1000,
        });

        await sendMailer({
          to: email,
          subject: "Your Register Verification",
          text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });

        return {
          code: 200,
          status: true,
          message:
            "OTP sent successfully. Please verify to complete registration.",
          data: { type: 1 },
        };
      } else {
        const user = await VerifyUsersModel.findOne({ email });
        if (!user) {
          return {
            code: 404,
            status: false,
            message: "User not found",
            data: null,
          };
        }

        if (user.otp !== Number(otp)) {
          return {
            code: 400,
            status: false,
            message: "Invalid OTP",
            data: null,
          };
        }

        if (Date.now() > user.otpExpireAt) {
          return {
            code: 400,
            status: false,
            message: "OTP expired",
            data: null,
          };
        }
        return {
          code: 200,
          status: true,
          message: "Email verified successfully! Registration complete.",
          data: { type: 2 },
        };
      }
    } catch (error) {
      console.log({ "Register Error": error });
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  login = async (req_Body) => {
    try {
      const { email, password, authCode } = req_Body;
      if (!email || !password) {
        return {
          code: 400,
          status: false,
          message: "Email and Password are required.",
          data: null,
        };
      }

      const userDet = await UsersModel.findOne({ email });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User not found!",
          data: null,
        };
      }
      if (password !== _DecPassword(userDet.password)) {
        return {
          code: 403,
          status: false,
          message: "Invalid password!",
          data: null,
        };
      }

      if (!authCode || authCode == 0) {
        if (!userDet.authSecret || userDet.authSecret === "") {
          const otp = genOtp();
          await UsersModel.findOneAndUpdate(
            { email },
            {
              $set: {
                authCode: otp,
                authExpiry: Date.now() + 2 * 60 * 1000,
              },
            }
          );

          await sendMailer({
            to: userDet.email,
            subject: "User Login OTP",
            text: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
          });

          return {
            code: 200,
            status: true,
            message: "OTP sent successfully. Enter OTP to continue.",
            data: { type: 1 },
          };
        } else {
          return {
            code: 200,
            status: true,
            message: "Enter your 2FA code to continue.",
            data: { email },
          };
        }
      }

      if (userDet.authSecret && userDet.authSecret !== "") {
        const isVerify = verify2FA(userDet.authSecret, authCode);
        if (!isVerify) {
          return {
            code: 403,
            status: false,
            message: "Invalid 2FA code!",
            data: null,
          };
        }
      } else {
        if (Date.now() > (userDet.authExpiry || 0)) {
          return {
            code: 403,
            status: false,
            message: "OTP expired! Please request a new one.",
            data: null,
          };
        }

        if (String(userDet.authCode) !== String(authCode)) {
          return {
            code: 403,
            status: false,
            message: "Invalid OTP!",
            data: null,
          };
        }

        await UsersModel.updateOne(
          { email },
          { $set: { authCode: 0, authExpiry: null } }
        );
      }
      const authToken = genAuthToken(userDet._id);
      return {
        code: 200,
        status: true,
        message: "Login successful!",
        data: { ...userDet, authToken, type: 2 },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  set2FAMode = async (req, req_Body) => {
    try {
      const { userId } = req;
      const { authCode, authSecret } = req_Body;
      const userDet = await UsersModel.findOne({ _id: userId });
      if (!userDet) {
        return {
          code: 403,
          status: false,
          message: "User not found!",
          data: null,
        };
      }
      if (userDet.authSecret && userDet.authSecret !== "") {
        const isVerify = verify2FA(userDet.authSecret, authCode);
        if (!isVerify) {
          return {
            code: 403,
            status: false,
            message: "Invalid 2FA Code",
            data: null,
          };
        }
        await UsersModel.updateOne(
          { _id: userId },
          {
            $set: {
              authSecret: "",
            },
          }
        );
        return {
          code: 200,
          status: true,
          message: "2FA code have been disabled",
          data: null,
        };
      } else {
        const isVerify = verify2FA(authSecret, authCode);
        if (!isVerify) {
          return {
            code: 403,
            status: false,
            message: "Invalid 2FA Code",
            data: null,
          };
        }

        await UsersModel.updateOne(
          { _id: userId },
          {
            $set: {
              authSecret: authSecret,
            },
          }
        );

        return {
          code: 200,
          status: true,
          message: "2FA code have been enabled",
          data: null,
        };
      }
    } catch (error) {
      console.error("set2FAMode error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  changePassword = async (req) => {
    try {
      const { userId } = req;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const user = await UsersModel.findOne({ _id: userId });
      if (!user) {
        return {
          code: 403,
          status: false,
          message: "User not found",
          data: null,
        };
      }
      if (!oldPassword || oldPassword === "") {
        return {
          code: 403,
          status: false,
          message: "Old password is incorrect",
          data: null,
        };
      }
      if (!newPassword || newPassword === "") {
        return {
          code: 403,
          status: false,
          message: "New Password is Required",
          data: null,
        };
      }
      if (!confirmPassword || confirmPassword === "") {
        return {
          code: 403,
          status: false,
          message: "Confirm Password is Required",
          data: null,
        };
      }

      const decryptedOldPassword = _DecPassword(user.password);
      if (decryptedOldPassword !== oldPassword) {
        return {
          code: 403,
          status: false,
          message: "Old password is incorrect",
          data: null,
        };
      }
      if (newPassword !== confirmPassword) {
        return {
          code: 403,
          status: false,
          message: "New password does not match the confirm password.",
          data: null,
        };
      }
      const encryptedNewPassword = _EncPassword(newPassword);
      await UsersModel.updateOne(
        { _id: userId },
        { $set: { password: encryptedNewPassword } }
      );
      return {
        code: 200,
        status: true,
        message: "Password Changed Successfully!",
        data: null,
      };
    } catch (error) {
      console.error("changePassword error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
  updateUserData = async (userId, req_Body) => {
    try {
      console.log({ req_Body });
      const existUser = await UsersModel.findOne({ _id: userId });
      if (!existUser) {
        return {
          code: 400,
          status: false,
          message: "User Not Found!",
          data: null,
        };
      }
      const user = await UsersModel.updateOne(
        { _id: userId },
        { $set: req_Body }
      );
      return {
        code: 200,
        status: true,
        message: "User Data has been updated!",
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
  getUser = async (userId) => {
    try {
      const userData = await UsersModel.findOne({ _id: userId });
      return {
        code: 200,
        status: true,
        message: "User Data Retrived Successfully!",
        data: userData,
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
}
export default new UserAuthService();
