import BattleService from '../services/BattleService.js';
import Battle from '../models/Battles.js';

class BattleController {

  async createBattle(req, res) {
    try {
      const userId = req.user._id;
      const battleData = req.body;
      const battle = await BattleService.createBattle(battleData, userId);

      res.status(201).json({
        success: true,
        message: "Battle created successfully",
        battle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async joinBattle(req, res) {
    try {
      const { battleId } = req.params;
      const userId = req.user._id;
      const { username, socketId } = req.body;

      const battle = await BattleService.joinBattle(battleId, userId, username, socketId);

      res.json({
        success: true,
        message: "Joined battle successfully",
        battle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getWaitingBattles(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const battles = await BattleService.getWaitingBattles(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        battles,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBattleDetails(req, res) {
    try {
      const { battleId } = req.params;
      const battle = await BattleService.getBattleDetails(battleId);

      if (!battle) {
        return res.status(404).json({
          success: false,
          message: "Battle not found",
        });
      }

      res.json({ success: true, battle });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async addBot(req, res) {
    try {
      const { battleId } = req.params;
      const battle = await BattleService.addBotToBattle(battleId);

      res.json({
        success: true,
        message: "Bot added successfully",
        battle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async startBattle(req, res) {
    try {
      const { battleId } = req.params;
      const userId = req.user._id;

      const battle = await Battle.findById(battleId);
      if (!battle || battle.creatorId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only creator can start battle",
        });
      }

      const updatedBattle = await BattleService.startBattle(battleId);

      res.json({
        success: true,
        message: "Battle started successfully",
        battle: updatedBattle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async cancelBattle(req, res) {
    try {
      const { battleId } = req.params;
      const userId = req.user._id;

      const battle = await BattleService.cancelBattle(battleId, userId);

      res.json({
        success: true,
        message: "Battle cancelled successfully",
        battle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyBattles(req, res) {
    try {
      const userId = req.user._id;
      const { status, page = 1, limit = 20 } = req.query;

      const query = {
        $or: [{ creatorId: userId }, { "players.userId": userId }],
      };

      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const battles = await Battle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("creatorId", "username avatar")
        .lean();

      const total = await Battle.countDocuments(query);

      res.json({
        success: true,
        battles,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new BattleController();
