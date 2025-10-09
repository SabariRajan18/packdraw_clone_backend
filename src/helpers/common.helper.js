import CryptoJS from "crypto-js";
import speakeasy from "speakeasy";
import dotenv from "dotenv";
import JWT from "jsonwebtoken";
dotenv.config();

const { JWT_SECRET, ENC_DEC_SECRET } = process.env;
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

export const generate2FA = () => {};

export const verify2FA = (secret, userToken) => {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: userToken,
    window: 1,
  });

  return verified;
};
