// config/redis.js
import Redis from 'ioredis';

class RedisManager {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.client = null;
    this.init();
  }

  init() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.client = new Redis(redisConfig);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const connections = [this.publisher, this.subscriber, this.client];
    connections.forEach(redis => {
      redis.on('connect', () => {
        console.log(`Redis ${redis.constructor.name} connected`);
      });
      
      redis.on('error', (err) => {
        console.error(`Redis ${redis.constructor.name} error:`, err);
      });

      redis.on('close', () => {
        console.log(`Redis ${redis.constructor.name} connection closed`);
      });
    });
  }

  // Battle room management
  async addToBattleRoom(battleId, socketId, userData) {
    const roomKey = `battle:${battleId}`;
    const userKey = `user:${userData.userId}`;
    
    const multi = this.client.multi();
    multi.hset(roomKey, socketId, JSON.stringify(userData));
    multi.set(userKey, JSON.stringify({ battleId, socketId }));
    multi.expire(roomKey, 3600); // 1 hour TTL
    multi.expire(userKey, 3600);
    
    return await multi.exec();
  }

  async removeFromBattleRoom(battleId, socketId, userId) {
    const roomKey = `battle:${battleId}`;
    const userKey = `user:${userId}`;
    
    const multi = this.client.multi();
    multi.hdel(roomKey, socketId);
    multi.del(userKey);
    
    return await multi.exec();
  }

  async getBattleRoomUsers(battleId) {
    const roomKey = `battle:${battleId}`;
    const users = await this.client.hgetall(roomKey);
    
    const result = {};
    for (const [socketId, userData] of Object.entries(users)) {
      result[socketId] = JSON.parse(userData);
    }
    return result;
  }

  async getUserBattle(userId) {
    const userKey = `user:${userId}`;
    const data = await this.client.get(userKey);
    return data ? JSON.parse(data) : null;
  }

  // Rate limiting
  async checkRateLimit(key, limit = 10, windowMs = 60000) {
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowMs / 1000);
    }
    
    return current <= limit;
  }

  // Cleanup
  async cleanupBattleRoom(battleId) {
    const roomKey = `battle:${battleId}`;
    await this.client.del(roomKey);
  }
}

export default new RedisManager();