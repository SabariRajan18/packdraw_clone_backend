import CryptoJS from "crypto-js";
import speakeasy from "speakeasy";
import dotenv from "dotenv";
import JWT from "jsonwebtoken";
import GameChip from "../models/GameChip.js";
dotenv.config();

const { JWT_SECRET, ENC_DEC_SECRET, SITE_NAME } = process.env;
export const _EncPassword = (password) => {
  const encPass = CryptoJS.AES.encrypt(password, ENC_DEC_SECRET).toString();
  return encPass;
};

export const _DecPassword = (password) => {
  const bytes = CryptoJS.AES.decrypt(password, ENC_DEC_SECRET);
  const originalPass = bytes.toString(CryptoJS.enc.Utf8);
  return originalPass;
};

export const genOtp = () => {
  const n = Math.floor(Math.random() * 1_000_000);
  const otp = String(n).padStart(6, "0");
  return otp;
};

export const genAuthToken = (id) => {
  const authToken = JWT.sign({ userId: id }, JWT_SECRET, { expiresIn: "24h" });
  return authToken;
};

export const generate2FASecret = async (email) => {
  const authConfigs = speakeasy.generateSecret({
    name: `${SITE_NAME} (${email})`,
    length: 20,
  });
  return authConfigs;
};

export const verify2FA = (secret, userToken) => {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: userToken,
    window: 1,
  });

  return verified;
};

export const getUserBalance = async (userId) => {
  try {
    const UserBalance = await GameChip.findOne({ user_id: userId });
    if (UserBalance) {
      return UserBalance;
    } else {
      const UserBalance = await GameChip.create({ user_id: userId });
      return UserBalance;
    }
  } catch (error) {
    console.error({ getUserBalance: error });
  }
};

export const deductAmount = async (userId, amount) => {
  try {
    if (!userId) {
      return { status: false, message: "Can't Find User!" };
    }
    await GameChip.findOneAndUpdate(
      { userId },
      { $inc: { total_chip_amount: -amount } }
    );
    return { status: true, message: "Amount Deducted" };
  } catch (error) {
    console.error({ deductAmount: error });
  }
};

export const creditAmount = async (userId, amount) => {
  try {
    if (!userId) {
      return { status: false, message: "Can't Find User!" };
    }
    await GameChip.findOneAndUpdate(
      { userId },
      { $inc: { total_chip_amount: +amount } }
    );
    return { status: true, message: "Amount Deducted" };
  } catch (error) {
    console.error({ deductAmount: error });
  }
};

export const calculateTotalAmount = (selectedPacks) => {
  const amount = selectedPacks.reduce(
    (acc, pack) => acc + (pack.packAmount || 0),
    0
  );
  return amount;
};

export const calculateTotalRewardAmount = (selectedRewards) => {
  const amount = selectedRewards.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );
  return amount;
};
