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
      const isAlreadyAdded = await PackDrawModel.findOneAndUpdate({
        _id: packsId,
        "items._id": itemId,
      });
      if (isAlreadyAdded) {
        return {
          code: 400,
          status: false,
          message: "This Item Already Added!",
          data: null,
        };
      }
      await PackDrawModel.findOneAndUpdate(
        { _id: packsId },
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
      const isAlreadyAdded = await PackDrawModel.findOneAndUpdate({
        _id: packsId,
        "items._id": itemId,
      });
      if (!isAlreadyAdded) {
        return {
          code: 400,
          status: false,
          message: "This Item Not Exist!",
          data: null,
        };
      }
      await PackDrawModel.findOneAndUpdate(
        { _id: packsId },
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
      if (!name || !image || !amount) {
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
      if (image === "" || !file) {
        return {
          code: 400,
          status: false,
          message: "No file uploaded!",
          data: null,
        };
      }
      const filename = `item_${Date.now()}_${file.originalname}`;
      const imageUrl = await uploadImage(file.buffer, filename);
      const updatedItem = await PacksItemsModel.findByIdAndUpdate(
        { _id: itemId },
        { name, image: image !== "" ? image : imageUrl, amount },
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
}
