import mongoose from "mongoose";
import CryptoJS from "crypto-js";
import speakeasy from "speakeasy";
import dotenv from "dotenv";
import JWT from "jsonwebtoken";
import GameChip from "../models/GameChip.js";
import PacksItemModel from "../models/PacksItems.js";
import PacksSpendModel from "../models/UserPacksSpend.js";
import UserLevelAndExp from "../config/exp.json" with { type : "json" }
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
    console.log("Amount Deducting Process");
    await GameChip.findOneAndUpdate(
      { user_id: userId },
      { $inc: { total_chip_amount: -amount } }
    );
    console.log("Amount Deducting Completed");
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
    console.log("Amount Crediting Process");
    await GameChip.findOneAndUpdate(
      { user_id: userId },
      { $inc: { total_chip_amount: +amount } }
    );
    console.log("Amount Crediting Completed");
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

export const getOrCreateUserSpends = async (packsIds) => {
  try {
    const objectIds = packsIds.map((id) => new mongoose.Types.ObjectId(id));
    const spends = await Promise.all(
      objectIds.map(async (packsId) => {
        const spend = await PacksSpendModel.findOneAndUpdate(
          { packsId },
          {
            $setOnInsert: {
              totalSpends: 0,
              isRareReached: false,
              isEpicReached: false,
            },
          },
          { new: true, upsert: true }
        );
        return spend;
      })
    );

    return spends;
  } catch (error) {
    console.error("Error in getOrCreateUserSpends:", error);
    throw error;
  }
};

export const rewardScript = async (rewardType, packsDet) => {
  const allRewardsItems = await PacksItemModel.aggregate([
    {
      $match: {
        _id: {
          $in: packsDet.items.map((id) => id),
        },
      },
    },
  ]);

  const getRandomItems = (arr, count) => {
    if (!arr || arr.length === 0) return [];
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getLowestAmountItems = (arr, count) => {
    if (!arr || arr.length === 0) return [];
    const sorted = arr.sort((a, b) => a.amount - b.amount);
    return sorted.slice(0, count);
  };

  // Filter by amount
  const commons = allRewardsItems.filter((item) => item.amount < 5000);
  const rares = allRewardsItems.filter(
    (item) => item.amount >= 5000 && item.amount < 10000
  );
  const epics = allRewardsItems.filter((item) => item.amount >= 10000);

  let rewardArray = [];

  const fillWithLowest = (arr, count) => {
    const selected = getRandomItems(arr, count);
    if (selected.length < count) {
      const needed = count - selected.length;
      const fallback = getLowestAmountItems(allRewardsItems, needed);
      return [...selected, ...fallback];
    }
    return selected;
  };

  if (rewardType === "common-only") {
    rewardArray = fillWithLowest(commons, 3);
  } else if (rewardType === "Two-Common-One-Rare") {
    const selectedCommons = fillWithLowest(commons, 2);
    const selectedRares = fillWithLowest(rares, 1);
    rewardArray = [...selectedCommons, ...selectedRares];
  } else if (rewardType === "Two-Rare-One-Common") {
    const selectedRares = fillWithLowest(rares, 2);
    const selectedCommons = fillWithLowest(commons, 1);
    rewardArray = [...selectedRares, ...selectedCommons];
  } else if (rewardType === "Two-Epic-One-Rare") {
    const selectedEpics = fillWithLowest(epics, 2);
    const selectedRares = fillWithLowest(rares, 1);
    rewardArray = [...selectedEpics, ...selectedRares];
  } else if (rewardType === "Two-Rare-One-Epic") {
    const selectedRares = fillWithLowest(rares, 2);
    const selectedEpics = fillWithLowest(epics, 1);
    rewardArray = [...selectedRares, ...selectedEpics];
  } else {
    return [];
  }

  // Return only valid IDs
  return rewardArray.map((item) => item._id).filter((id) => id);
};

export const getOneRandomId = (arr) => {
  if (!arr || arr.length === 0) return null;
  const randomItem = arr[Math.floor(Math.random() * arr.length)];
  return randomItem?._id || null;
};

export const getBattlePlayerCount = (battleType, players) => {
  if (!battleType || !players) return 0;
  const soloCounts = {
    2: 2,
    3: 3,
    4: 4,
    6: 6,
  };
  const teamCounts = {
    "2v2": 4,
    "3v3": 6,
    "2v2v2": 6,
  };

  if (battleType === "Solo") {
    return soloCounts[players] || 0;
  } else if (battleType === "Team") {
    return teamCounts[players] || 0;
  }

  return 0;
};

export function WithoutRounding(value, decimals = 2) {
  let str = String(value);

  // If scientific notation, convert safely
  if (str.includes("e") || str.includes("E")) {
    const num = Number(value);
    str = num.toLocaleString("fullwide", { useGrouping: false });
  }

  // Split integer + decimal
  let [intPart, decPart = ""] = str.split(".");

  // Cut the decimals (no rounding)
  decPart = decPart.slice(0, decimals).padEnd(decimals, "0");

  return decimals > 0 ? `${intPart}.${decPart}` : intPart;
}

export const randomBetween = (min, max) => {
  return Number(Math.floor(Math.random() * (max - min + 1)) + min);
};

export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const groupedData = (productDets) => {
  const groupedIds = productDets.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item._id);
    return acc;
  }, {});
  return groupedIds;
};

export const addExperience = (user, amount) => {
  const gainedExp = amount * UserLevelAndExp.expPerDollar;
  user.exp += gainedExp;
  const levelsGained = Math.floor(user.exp / UserLevelAndExp.expPerLevel);

  if (levelsGained > 0) {
    user.level += levelsGained;
    user.exp -= levelsGained * UserLevelAndExp.expPerLevel;
  }
  user.save();
  return user;
};