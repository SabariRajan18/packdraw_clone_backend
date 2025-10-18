// controllers/adminController/packdraw.controller.js
import {
  errorResponse,
  successResponse,
} from "../../helpers/response.helper.js";
import AdminPackDrawService from "../../services/adminService/packdraw.service.js";
import PackDrawModel from "../../models/Packdraw.js";
import PacksItemsModel from "../../models/PacksItems.js";

class AdminPackDrawController {
  addPacks = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacks(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updatePacks = async (req, res) => {
    try {
      const response = await AdminPackDrawService.updatePacks(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  addPacksItems = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacksItems(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  removePacksItems = async (req, res) => {
    try {
      const response = await AdminPackDrawService.removePacksItems(req.body);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  addPacksProducts = async (req, res) => {
    try {
      const response = await AdminPackDrawService.addPacksProducts(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  updatePacksProducts = async (req, res) => {
    try {
      const response = await AdminPackDrawService.updatePacksProducts(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  // NEW CONTROLLER METHODS FOR FRONTEND
  getPacks = async (req, res) => {
    try {
      const response = await AdminPackDrawService.getPacks(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getPackById = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminPackDrawService.getPackById(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  deletePack = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminPackDrawService.deletePack(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getItems = async (req, res) => {
    try {
      const response = await AdminPackDrawService.getItems(req.query);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  getItemById = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminPackDrawService.getItemById(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  deleteItem = async (req, res) => {
    try {
      const { id } = req.params;
      const response = await AdminPackDrawService.deleteItem(id);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  // Additional utility endpoints
  getPackStats = async (req, res) => {
    try {
      const totalPacks = await PackDrawModel.countDocuments();
      const totalItems = await PacksItemsModel.countDocuments();
      const packsWithItems = await PackDrawModel.aggregate([
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemsInPacks: { $sum: "$itemCount" },
            averageItemsPerPack: { $avg: "$itemCount" },
          },
        },
      ]);

      await successResponse(req, res, {
        code: 200,
        status: true,
        message: "Pack stats retrieved successfully",
        data: {
          totalPacks,
          totalItems,
          totalItemsInPacks: packsWithItems[0]?.totalItemsInPacks || 0,
          averageItemsPerPack: packsWithItems[0]?.averageItemsPerPack || 0,
        },
      });
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };

  createPacksImages = async (req, res) => {
    try {
      const response = await AdminPackDrawService.createPacksImages(req);
      await successResponse(req, res, response);
    } catch (error) {
      await errorResponse(req, res, error);
    }
  };
}

export default new AdminPackDrawController();
