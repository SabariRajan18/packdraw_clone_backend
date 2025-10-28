import dotenv from "dotenv";
dotenv.config();
import BattlesModel from "../models/Battles.js";
import CronJob from "node-cron";
import { broadcastEvent } from "../helpers/socket.helper.js";
const { CRON_STATUS = "De-Active" } = process.env;
let isActiveBattleMonitered = false;

const moniterActiveBattle = async () => {
  if (isActiveBattleMonitered) return;
  isActiveBattleMonitered = true;
  try {
    const activeBattles = await BattlesModel.find()
      .populate({
        path: "packsIds",
        model: "PackDraw",
        populate: [
          {
            path: "items",
            model: "PacksItems",
          },
          {
            path: "wallpaper",
            model: "PacksImages",
            select: "wallpaper -_id",
          },
        ],
      })
      .limit(20)
      .lean();
    const formattedBattles = activeBattles.map((battle) => ({
      ...battle,
      packsIds: battle.packsIds.map((pack) => ({
        ...pack,
        wallpaper: pack.wallpaper?.wallpaper || "",
      })),
    }));

    await broadcastEvent("all-battles", formattedBattles);
  } catch (error) {
    console.error({ moniterActiveBattle: error });
  } finally {
    isActiveBattleMonitered = false;
  }
};

if (CRON_STATUS === "ACTIVE") {
  CronJob.schedule(" * * * * * * ", async () => {
    await moniterActiveBattle();
  });
}
