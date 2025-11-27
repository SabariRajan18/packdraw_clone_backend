// middleware/rateLimit.js
import RedisManager from '../config/redis.js';

export const rateLimitSocket = async (socket, next) => {
  try {
    const userId = socket.userId;
    const allowed = await RedisManager.checkRateLimit(
      `rate_limit:${userId}:connection`,
      10, // 10 connections per minute
      60000
    );
    
    if (!allowed) {
      return next(new Error('Too many connections'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const rateLimitAPI = (limit = 10, windowMs = 60000) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const key = `rate_limit:${userId}:${req.path}`;
      
      const allowed = await RedisManager.checkRateLimit(key, limit, windowMs);
      
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMITED'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};