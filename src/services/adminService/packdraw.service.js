// services/adminService/packdraw.service.js
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemsModel from "../../models/PacksItems.js";
import { uploadImage } from "../../config/cloudinary.js";

export default new class AdminPackDrawService {
  addPacks = async (request) => {
    try {
      const { packAmount, creator, name } = request.body;
      const file = request.file;
      if (!file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }

      if (!packAmount) {
        return {
          code: 400,
          status: false,
          message: "packAmount required!",
          data: null,
        };
      }
      const filename = `pack_${Date.now()}_${file.originalname}`;
      const imageUrl = await uploadImage(file.buffer, filename);
      const insertData = {
        name,
        packAmount,
        wallpaper: imageUrl,
        creator,
      };
      const data = await PackDrawModel.create(insertData);

      return {
        code: 201,
        status: true,
        message: "Packs Created successfully!",
        data: data,
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

  updatePacks = async (request) => {
    try {
      const { packAmount, image, packsId } = request.body;
      const file = request.file;
      if (image === "" && !file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }
      if (!packAmount) {
        return {
          code: 400,
          status: false,
          message: "packAmount required!",
          data: null,
        };
      }
      let imageUrl = "";
      if (file) {
        const filename = `pack_${Date.now()}_${file.originalname}`;
        imageUrl = await uploadImage(file.buffer, filename);
      } else {
        imageUrl = image;
      }

      const insertData = {
        packAmount: packAmount,
        wallpaper: imageUrl,
      };
      const data = await PackDrawModel.updateOne(
        { _id: packsId },
        { $set: insertData }
      );

      return {
        code: 200,
        status: true,
        message: "Packs updated successfully!",
        data: data,
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

  addPacksItems = async (req) => {
    try {
      const { packsId, itemId } = req;
      const isItem = await PacksItemsModel.findOne({ _id: itemId });
      if (!isItem) {
        return {
          code: 400,
          status: false,
          message: "Item Not Found",
          data: null,
        };
      }
      const isAlreadyAdded = await PackDrawModel.findOne({
        _id: packsId,
        items: itemId
      });
      if (isAlreadyAdded) {
        return {
          code: 400,
          status: false,
          message: "This Item Already Added!",
          data: null,
        };
      }
      await PackDrawModel.findByIdAndUpdate(
        packsId,
        { $push: { items: itemId } }
      );
      return {
        code: 200,
        status: true,
        message: "Item Added Successfully!",
        data: null,
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

  removePacksItems = async (req) => {
    try {
      const { packsId, itemId } = req;
      const isItem = await PacksItemsModel.findOne({ _id: itemId });
      if (!isItem) {
        return {
          code: 400,
          status: false,
          message: "Item Not Found",
          data: null,
        };
      }
      const isAlreadyAdded = await PackDrawModel.findOne({
        _id: packsId,
        items: itemId
      });
      if (!isAlreadyAdded) {
        return {
          code: 400,
          status: false,
          message: "This Item Not Exist!",
          data: null,
        };
      }
      await PackDrawModel.findByIdAndUpdate(
        packsId,
        { $pull: { items: itemId } }
      );
      return {
        code: 200,
        status: true,
        message: "Item Removed Successfully!",
        data: null,
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

  addPacksProducts = async (req) => {
    try {
      const file = req.file;
      const { name, amount } = req.body;
      
      // Fixed: removed !image check since it's not in req.body
      if (!name || !amount) {
        return {
          code: 400,
          status: false,
          message: "All fields are required!",
          data: null,
        };
      }
      if (!file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }
      const filename = `item_${Date.now()}_${file.originalname}`;
      const imageUrl = await uploadImage(file.buffer, filename);
      const newItem = new PacksItemsModel({ name, image: imageUrl, amount });
      await newItem.save();
      return {
        code: 201,
        status: true,
        message: "Item created successfully",
        data: newItem,
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

  updatePacksProducts = async (req) => {
    try {
      const file = req.file;
      const { name, image, amount, itemId } = req.body;
      const isValidItem = await PacksItemsModel.findOne({ _id: itemId });
      if (!isValidItem) {
        return {
          code: 400,
          status: false,
          message: "Item Not Found!",
          data: null,
        };
      }
      
      // Fixed: Check if no file and no existing image
      if (!image && !file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }
      
      let imageUrl = image;
      if (file) {
        const filename = `item_${Date.now()}_${file.originalname}`;
        imageUrl = await uploadImage(file.buffer, filename);
      }

      const updatedItem = await PacksItemsModel.findByIdAndUpdate(
        itemId,
        { name, image: imageUrl, amount },
        { new: true, runValidators: true }
      );
      return {
        code: 200,
        status: true,
        message: "Item updated successfully",
        data: updatedItem,
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

  // NEW METHODS FOR FRONTEND
  getPacks = async (query = {}) => {
    try {
      const { page = 1, limit = 10, search = '' } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { creator: { $regex: search, $options: 'i' } }
        ];
      }

      const packs = await PackDrawModel.find(filter)
        .populate('items')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PackDrawModel.countDocuments(filter);

      return {
        code: 200,
        status: true,
        message: "Packs retrieved successfully",
        data: {
          packs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
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

  getPackById = async (packId) => {
    try {
      const pack = await PackDrawModel.findById(packId).populate('items');
      if (!pack) {
        return {
          code: 404,
          status: false,
          message: "Pack not found",
          data: null,
        };
      }

      return {
        code: 200,
        status: true,
        message: "Pack retrieved successfully",
        data: pack,
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

  deletePack = async (packId) => {
    try {
      const pack = await PackDrawModel.findById(packId);
      if (!pack) {
        return {
          code: 404,
          status: false,
          message: "Pack not found",
          data: null,
        };
      }

      await PackDrawModel.findByIdAndDelete(packId);

      return {
        code: 200,
        status: true,
        message: "Pack deleted successfully",
        data: null,
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

  getItems = async (query = {}) => {
    try {
      const { page = 1, limit = 10, search = '' } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }

      const items = await PacksItemsModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PacksItemsModel.countDocuments(filter);

      return {
        code: 200,
        status: true,
        message: "Items retrieved successfully",
        data: {
          items,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
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

  getItemById = async (itemId) => {
    try {
      const item = await PacksItemsModel.findById(itemId);
      if (!item) {
        return {
          code: 404,
          status: false,
          message: "Item not found",
          data: null,
        };
      }

      return {
        code: 200,
        status: true,
        message: "Item retrieved successfully",
        data: item,
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

  deleteItem = async (itemId) => {
    try {
      const item = await PacksItemsModel.findById(itemId);
      if (!item) {
        return {
          code: 404,
          status: false,
          message: "Item not found",
          data: null,
        };
      }

      // Remove item from all packs
      await PackDrawModel.updateMany(
        { items: itemId },
        { $pull: { items: itemId } }
      );

      await PacksItemsModel.findByIdAndDelete(itemId);

      return {
        code: 200,
        status: true,
        message: "Item deleted successfully",
        data: null,
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
}();