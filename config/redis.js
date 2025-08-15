
const redis = require('redis');
const config = require('./config');

let redisClient;

const connectRedis = async () => {
  try {
    // Skip Redis in development if not available
    // if (config.nodeEnv === 'development' && !config.redisHost) {
    //   console.log('Redis skipped - using development mode');
    //   return;
    // }

    redisClient = redis.createClient({
      password: config.redisPw,
      socket: {
          host: config.redisHost,
          port: config.redisPort,
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.log('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.log('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('Redis connection failed, continuing without Redis:', error.message);
    redisClient = null;
  }
};

// Session management
const setSession = async (token, userId, expirationInSeconds = 86400) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`session:${token}`, expirationInSeconds, userId);
  } catch (error) {
    console.error('Redis setSession error:', error);
  }
};

const getSession = async (token) => {
  if (!redisClient) return null;
  try {
    return await redisClient.get(`session:${token}`);
  } catch (error) {
    console.error('Redis getSession error:', error);
    return null;
  }
};

const deleteSession = async (token) => {
  if (!redisClient) return;
  try {
    await redisClient.del(`session:${token}`);
  } catch (error) {
    console.error('Redis deleteSession error:', error);
  }
};

// Driver location management
const setDriverLocation = async (driverId, location) => {
  if (!redisClient) return;
  try {
    const locationData = {
      ...location,
      timestamp: new Date().toISOString()
    };
    await redisClient.setEx(`driver:location:${driverId}`, 3600, JSON.stringify(locationData));
  } catch (error) {
    console.error('Redis setDriverLocation error:', error);
  }
};

const getDriverLocation = async (driverId) => {
  if (!redisClient) return null;
  try {
    const locationStr = await redisClient.get(`driver:location:${driverId}`);
    return locationStr ? JSON.parse(locationStr) : null;
  } catch (error) {
    console.error('Redis getDriverLocation error:', error);
    return null;
  }
};

const getAllDriverLocations = async () => {
  if (!redisClient) return {};
  try {
    const keys = await redisClient.keys('driver:location:*');
    const locations = {};
    
    for (const key of keys) {
      const driverId = key.replace('driver:location:', '');
      const locationStr = await redisClient.get(key);
      if (locationStr) {
        locations[driverId] = JSON.parse(locationStr);
      }
    }
    
    return locations;
  } catch (error) {
    console.error('Redis getAllDriverLocations error:', error);
    return {};
  }
};

// User status management
const setUserStatus = async (userId, status) => {
  if (!redisClient) return;
  try {
    const statusData = {
      status,
      timestamp: new Date().toISOString()
    };
    await redisClient.setEx(`user:status:${userId}`, 3600, JSON.stringify(statusData));
  } catch (error) {
    console.error('Redis setUserStatus error:', error);
  }
};

const getUserStatus = async (userId) => {
  if (!redisClient) return null;
  try {
    const statusStr = await redisClient.get(`user:status:${userId}`);
    return statusStr ? JSON.parse(statusStr) : null;
  } catch (error) {
    console.error('Redis getUserStatus error:', error);
    return null;
  }
};

// FCM token management
const setFCMToken = async (userId, token) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`fcm:${userId}`, 2592000, token); // 30 days
  } catch (error) {
    console.error('Redis setFCMToken error:', error);
  }
};

const getFCMToken = async (userId) => {
  if (!redisClient) return null;
  try {
    return await redisClient.get(`fcm:${userId}`);
  } catch (error) {
    console.error('Redis getFCMToken error:', error);
    return null;
  }
};

// Order caching
const cacheOrder = async (orderId, orderData, expirationInSeconds = 3600) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`order:${orderId}`, expirationInSeconds, JSON.stringify(orderData));
  } catch (error) {
    console.error('Redis cacheOrder error:', error);
  }
};

const getCachedOrder = async (orderId) => {
  if (!redisClient) return null;
  try {
    const orderStr = await redisClient.get(`order:${orderId}`);
    return orderStr ? JSON.parse(orderStr) : null;
  } catch (error) {
    console.error('Redis getCachedOrder error:', error);
    return null;
  }
};

// Rate limiting
const checkRateLimit = async (key, maxRequests = 100, windowInSeconds = 3600) => {
  if (!redisClient) return true;
  try {
    const current = await redisClient.get(`ratelimit:${key}`);
    if (!current) {
      await redisClient.setEx(`ratelimit:${key}`, windowInSeconds, '1');
      return true;
    }
    
    const count = parseInt(current);
    if (count >= maxRequests) {
      return false;
    }
    
    await redisClient.incr(`ratelimit:${key}`);
    return true;
  } catch (error) {
    console.error('Redis checkRateLimit error:', error);
    return true; // Allow on error
  }
};

// Analytics caching
const cacheAnalytics = async (key, data, expirationInSeconds = 86400) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`analytics:${key}`, expirationInSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Redis cacheAnalytics error:', error);
  }
};

const getCachedAnalytics = async (key) => {
  if (!redisClient) return null;
  try {
    const dataStr = await redisClient.get(`analytics:${key}`);
    return dataStr ? JSON.parse(dataStr) : null;
  } catch (error) {
    console.error('Redis getCachedAnalytics error:', error);
    return null;
  }
};

// Notification queue
const addToNotificationQueue = async (userId, notification) => {
  if (!redisClient) return;
  try {
    await redisClient.lPush(`notifications:${userId}`, JSON.stringify(notification));
    await redisClient.lTrim(`notifications:${userId}`, 0, 99); // Keep last 100
    await redisClient.expire(`notifications:${userId}`, 2592000); // 30 days
  } catch (error) {
    console.error('Redis addToNotificationQueue error:', error);
  }
};

const getNotificationQueue = async (userId, limit = 10) => {
  if (!redisClient) return [];
  try {
    const notifications = await redisClient.lRange(`notifications:${userId}`, 0, limit - 1);
    return notifications.map(n => JSON.parse(n));
  } catch (error) {
    console.error('Redis getNotificationQueue error:', error);
    return [];
  }
};

module.exports = {
  connectRedis,
  setSession,
  getSession,
  deleteSession,
  setDriverLocation,
  getDriverLocation,
  getAllDriverLocations,
  setUserStatus,
  getUserStatus,
  setFCMToken,
  getFCMToken,
  cacheOrder,
  getCachedOrder,
  checkRateLimit,
  cacheAnalytics,
  getCachedAnalytics,
  addToNotificationQueue,
  getNotificationQueue
};
