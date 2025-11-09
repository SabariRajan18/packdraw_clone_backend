import PacksItems from "../../models/PacksItems.js";

class UserDealsService {
  getAllItems = async (reqQuery) => {
    try {
      let where = {};
      const { limit = 50, page = 1, price = 1, min, max, search } = reqQuery;

      if (min !== undefined && min !== "" && !isNaN(min)) {
        where.amount = { ...where.amount, $gte: Number(min) };
      }

      if (max !== undefined && max !== "" && !isNaN(max)) {
        where.amount = { ...where.amount, $lte: Number(max) };
      }

      if (search && search.trim() !== "") {
        where.name = { $regex: search.trim(), $options: "i" }; // case-insensitive search
      }

      const skip = (Number(page) - 1) * Number(limit);

      const sortOption = { amount: Number(price) };

      // ✅ Fetch data
      const data = await PacksItems.find(where)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit));

      const total = await PacksItems.countDocuments(where);

      return {
        code: 200,
        status: true,
        message: "All Items Data",
        data: {
          data,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (error) {
      console.error("getAllItems error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}

export default new UserDealsService();
