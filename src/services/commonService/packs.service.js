import PackDrawModel from "../../models/Packdraw.js";
class CommonPacksService {
  getAllPacks = async (req_Query) => {
    try {
      const page = parseInt(req_Query.page) || 1;
      const limit = parseInt(req_Query.limit) || 10;
      const skip = (page - 1) * limit;

      const allData = await PackDrawModel.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      const total = await PackDrawModel.countDocuments();
      return {
        status: true,
        message: "Users fetched successfully",
        data: {
          allData: allData || [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
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
export default new CommonPacksService();
