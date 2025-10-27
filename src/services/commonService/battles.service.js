import BattleConfigs from "../../config/battles.json" with {type:"json"};

class CommonBattlesService {
    getBattleConfigs = async () => {
        try {
           return {
        code: 200,
        status: true,
        message: "Battle Configs",
        data: BattleConfigs,
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
export default new CommonBattlesService();
