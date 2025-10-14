class UserPacksService {
  spinPacks = async (userId) => {
    try {
        
    } catch (error) {
      console.error("spinPacks error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };
}

export default new UserPacksService();
