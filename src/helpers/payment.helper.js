import axios from "axios";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";

const algorithm = "aes-256-cbc";
const tempsecretKey = process.env.TEMP_SECRET_KEY;

/**
 * ✅ Get minimum fiat equivalent amount for a given crypto
 */
export const getMinamount = async (amount, coin) => {
  const host = "https://api.nowpayments.io";
  const config = {
    method: "get",
    url: `${host}/v1/min-amount?currency_from=${coin}&currency_to=usd&fiat_equivalent=usd&is_fixed_rate=False&is_fee_paid_by_user=False`,
    headers: {
      "x-api-key": process.env.NOWPAYMENTS_API_KEY || "R58B880-3F54VJ4-NWV0GCS-KNRM7DV",
    },
  };

  try {
    const response = await axios.request(config);
    const minAmount = response.data.fiat_equivalent;
    const isValid = amount > minAmount;
    console.log("getMinamount →", { isValid, minAmount });
    return { status: isValid, min: minAmount };
  } catch (error) {
    console.error("Error fetching min amount:", error.message);
    return { status: false, min: null };
  }
};

/**
 * ✅ Get estimated conversion price from one currency to another
 */
export const getEstimatedPrice = async (amount, currencyFrom, currencyTo = "usd") => {
  const url = "https://api.nowpayments.io/v1/estimate";
  const headers = {
    "x-api-key": process.env.NOWPAYMENTS_API_KEY || "R58B880-3F54VJ4-NWV0GCS-KNRM7DV",
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { amount, currency_from: currencyFrom, currency_to: currencyTo },
    });
    return response.data.estimated_amount;
  } catch (error) {
    console.error("getEstimatedPrice error:", error.message);
    return { error: error.response?.status, message: error.response?.data };
  }
};

/**
 * ✅ Generate a secure random 6-character OTP
 */
export const generateOTP = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};

/**
 * ✅ Generate a unique request ID
 */
export const getUniqueRequestId = () => {
  const randomString = crypto.randomBytes(4).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${randomString}`;
};

/**
 * ✅ Encrypt text using AES-256-CBC
 */
export const encrypt = (text) => {
  const cipher = crypto.createCipher(algorithm, tempsecretKey);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

/**
 * ✅ Decrypt text using AES-256-CBC
 */
export const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipher(algorithm, tempsecretKey);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * ✅ Sanitize HTML input
 */
export const cleanHtml = (dirty) => {
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  });
};
