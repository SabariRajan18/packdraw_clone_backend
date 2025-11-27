import battleService from '../../services/userService/battleService.js';

class BattleController {
  // Create battle
  async createBattle(req, res) {
    try {
      const battleData = {
        ...req.body,
        creatorId: req.user.id,
        creatorType: 'user'
      };

      const result = await battleService.createBattle(battleData);
      
      if (result.success) {
        res.status(201).json({
          status: true,
          message: 'Battle created successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Get all battles
  async getAllBattles(req, res) {
    try {
      const filters = req.query;
      const result = await battleService.getAllBattles(filters);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Join battle
  async joinBattle(req, res) {
    try {
      const { battleId } = req.body;
      const userData = {
        userId: req.user.id,
        username: req.user.username,
        avatar: req.user.profileImage
      };

      const result = await battleService.joinBattle(battleId, userData);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Get battle info
  async getBattleInfo(req, res) {
    try {
      const { battleId } = req.params;
      const result = await battleService.getBattleInfo(battleId);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Start battle
  async startBattle(req, res) {
    try {
      const { battleId } = req.body;
      const result = await battleService.startBattle(battleId);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Open pack
  async openPack(req, res) {
    try {
      const { battleId, round, packIndex } = req.body;
      const userId = req.user.id;

      const result = await battleService.openPack(battleId, userId, round, packIndex);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Complete battle
  async completeBattle(req, res) {
    try {
      const { battleId } = req.body;
      const result = await battleService.completeBattle(battleId);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }

  // Get user battles
  async getUserBattles(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await battleService.getUserBattles(userId, filters);
      
      if (result.success) {
        res.status(200).json({
          status: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          status: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  }
}

export default new BattleController();