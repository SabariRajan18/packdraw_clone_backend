import QRCode from "qrcode";
import UsersModel from "../../models/Users.js";
import VerifyUsersModel from "../../models/VerifyUser.js";
import {
  _EncPassword,
  _DecPassword,
  genOtp,
  verify2FA,
  genAuthToken,
  generate2FASecret,
  getUserBalance,
} from "../../helpers/common.helper.js";
import sendMailer from "../../helpers/mail.helper.js";
import GameChip from "../../models/GameChip.js";
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

      // Check if user already exists in main Users collection
      const existUser = await UsersModel.findOne({ email });
      if (existUser) {
        return {
          code: 403,
          status: false,
          message: "E-Mail already exists!",
          data: null,
        };
      }

      // Check if user exists in VerifyUsers collection (pending verification)
      const isVerifyUser = await VerifyUsersModel.findOne({ email });

      // If no verification record exists OR OTP is expired, create new OTP
      if (
        !isVerifyUser ||
        (isVerifyUser && Date.now() > isVerifyUser.otpExpireAt)
      ) {
        // If existing OTP is expired, delete the old record
        if (isVerifyUser && Date.now() > isVerifyUser.otpExpireAt) {
          await VerifyUsersModel.deleteOne({ email });
        }

        // Generate new OTP
        const newOtp = genOtp();
        await VerifyUsersModel.create({
          email,
          otp: newOtp,
          type: "register",
          otpExpireAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        });

        // Send OTP email
        await sendMailer({
          to: email,
          subject: "Your Register Verification",
          text: `Your OTP code is ${newOtp}. It will expire in 5 minutes.`,
        });

        return {
          code: 200,
          status: true,
          message:
            "OTP sent successfully. Please verify to complete registration.",
          data: {
            type: 1,
            otpStatus: "sent", // New field to indicate OTP status
            email: email,
          },
        };
      }
      // If verification record exists and OTP is not expired
      else {
        const user = await VerifyUsersModel.findOne({ email });

        if (!user) {
          return {
            code: 404,
            status: false,
            message: "User not found",
            data: null,
          };
        }

        // If OTP is provided, verify it
        if (otp) {
          if (user.otp !== Number(otp)) {
            return {
              code: 400,
              status: false,
              message: "Invalid OTP",
              data: { type: 1, otpStatus: "invalid" },
            };
          }

          if (Date.now() > user.otpExpireAt) {
            return {
              code: 400,
              status: false,
              message: "OTP expired",
              data: { type: 1, otpStatus: "expired" },
            };
          }

          // OTP is valid and not expired - Complete registration
          const encryptedPassword = _EncPassword(password);
          const newUser = new UsersModel({
            email,
            password: encryptedPassword,
          });
          await newUser.save();

          // Clean up verification record
          await VerifyUsersModel.deleteOne({ email });
          await getUserBalance(newUser._id);  
          return {
            code: 200,
            status: true,
            message: "Email verified successfully! Registration complete.",
            data: { type: 2 },
          };
        }
        // If no OTP provided but verification record exists
        else {
          // Check OTP status
          const isOtpExpired = Date.now() > user.otpExpireAt;

          if (isOtpExpired) {
            // Generate new OTP if expired
            const newOtp = genOtp();
            await VerifyUsersModel.findOneAndUpdate(
              { email },
              {
                otp: newOtp,
                otpExpireAt: Date.now() + 5 * 60 * 1000,
              }
            );

            await sendMailer({
              to: email,
              subject: "Your Register Verification",
              text: `Your OTP code is ${newOtp}. It will expire in 5 minutes.`,
            });

            return {
              code: 200,
              status: true,
              message: "New OTP sent. Previous OTP was expired.",
              data: {
                type: 1,
                otpStatus: "resent",
                email: email,
              },
            };
          } else {
            // OTP is still valid, remind user to enter it
            return {
              code: 200,
              status: true,
              message: "OTP already sent. Please enter the verification code.",
              data: {
                type: 1,
                otpStatus: "pending",
                email: email,
              },
            };
          }
        }
      }
    } catch (error) {
      console.error({ "Register Error": error });
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
            data: { type: 1 },
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
  googleAuth = async (req_Body) => {
    try {
      if (req_Body.type === "register") {
        const { data } = req_Body.userInfo;
        const existUser = await UsersModel.findOne({ email: data.email });
        if (existUser) {
          return {
            code: 403,
            status: false,
            message: "This Email Is Already Exist. Try New One!",
            data: null,
          };
        }
        const userDet = await UsersModel.create({
          email: data.userInfo.email,
          password: "",
          isGoogleAct: true,
          profileImage: data.userInfo.picture,
        });
        return {
          code: 200,
          status: true,
          message: "Email verified successfully! Registration complete.",
          data: userDet,
        };
      }
      if (req_Body.type === "login") {
        let email = "";
        if (req_Body.submitType === "2FA-Login") {
          email = req_Body.email;
        } else {
          const { data } = req_Body.userInfo;
          email = data.email;
        }
        const userDet = await UsersModel.findOne({ email: email });
        if (!userDet) {
          return {
            code: 403,
            status: false,
            message: "User Not Found!",
            data: null,
          };
        }
        const authCode = req_Body.authCode;
        if (!authCode || authCode == 0) {
          if (!userDet.authSecret || userDet.authSecret === "") {
            const authToken = genAuthToken(userDet._id);
            return {
              code: 200,
              status: true,
              message: "Login successful!",
              data: { ...userDet, authToken, type: 2 },
            };
          } else {
            return {
              code: 200,
              status: true,
              message: "Enter your 2FA code to continue.",
              data: { type: 1 },
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
        }
        const authToken = genAuthToken(userDet._id);
        return {
          code: 200,
          status: true,
          message: "Login successful!",
          data: { ...userDet, authToken, type: 2 },
        };
      }
    } catch (error) {
      console.error("Google Auth error:", error);
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
      const user = await UsersModel.findOne({ _id: userId }).lean();
      let balance;
      const gamechip = await GameChip.findOne({})
      const authConfig = await generate2FASecret(user.email);

      let userData = user;
      if (user.authSecret === "") {
        const qrCodeDataURL = await QRCode.toDataURL(authConfig.otpauth_url);
        userData.authConfig = {
          base32: authConfig.base32,
          otpauth_url: authConfig.otpauth_url,
          qrCodeDataURL: qrCodeDataURL,
        };
      }
      if (user.authSecret !== "") {
        delete user.authSecret;
      }
      return {
        code: 200,
        status: true,
        message: "User Data Retrived Successfully!",
        data: userData,
      };
    } catch (error) {
      console.error({ error });
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
