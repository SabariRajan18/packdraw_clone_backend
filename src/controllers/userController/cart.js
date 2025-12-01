import PacksSpinHistory from "../../models/PacksSpinHistory.js";
import DealsSpinHistory from "../../models/DealsSpinHistory.js";
import DrawSpinHistory from "../../models/DrawSpinHistory.js";
import { creditAmount, groupedData } from "../../helpers/common.helper.js";

export const sellProducts = async (req, res) => {
  try {
    let grandTotal = 0;
    let typeWiseTotals = {};
    const { productDets } = req.body;
    const { userId } = req;
    const gropedData = groupedData(productDets);
    const models = {
      packs: PacksSpinHistory,
      battles: PacksSpinHistory,
      deals: DealsSpinHistory,
      draws: DrawSpinHistory,
    };

    for (const type in gropedData) {
      const Model = models[type.toLowerCase()];

      if (!Model) {
        console.log(`No model found for type: ${type}`);
        continue;
      }

      const ids = gropedData[type];
      const docs = await Model.find({ _id: { $in: ids } }, { rewardAmount: 1 });
      const total = docs.reduce(
        (sum, item) => sum + (item.rewardAmount || 0),
        0
      );
      typeWiseTotals[type] = total;
      grandTotal += total;

      await Model.updateMany(
        { _id: { $in: ids } },
        { $set: { isClaimed: true, type: "Sell" } }
      );
    }
    if (grandTotal > 0) {
      await creditAmount(userId, grandTotal);
    }
    res.send({
      code: 200,
      status: true,
      message:
        productDets.length === 1
          ? "The product has been sold successfully"
          : "All selected products have been sold successfully",
      data: null,
    });
  } catch (error) {
    console.error({ sellProducts: error });
    res.send({
      code: 500,
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};
