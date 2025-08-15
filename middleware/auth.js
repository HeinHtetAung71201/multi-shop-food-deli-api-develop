const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getSession } = require('../config/redis');
const config = require('../config/config');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    // Verify JWT token
    const decoded = jwt.verify(token,config.jwtSecret);
  

    // Check if session exists in Redis
    // const sessionUserId = await getSession(token);
    // if (!sessionUserId || sessionUserId !== decoded.userId) {
    //   return res.status(401).json({ message: 'Invalid or expired session' });
    // }

    // Get user from database
    const user = await User.findById(decoded.userId);
    console.log(user)
    if (!user) {
      return res.status(401).json({ message: 'User not found dsd' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Attach user to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopId
    };

    next();
  } catch (error) {
    console.log(error.message)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret);

    const sessionUserId = await getSession(token);
    if (sessionUserId && sessionUserId === decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  auth,
  authorize,
  optionalAuth
};