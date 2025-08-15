
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');
const { setSession, deleteSession } = require('../config/redis');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');
const RecentActivities = require('../models/RecentActivities');

const googleClient = new OAuth2Client(config.googleClientId);

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId:user._id, 
      role:user.role},
     config.jwtSecret, { expiresIn: config.jwtExpire });
};

class AuthController {
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }
      console.log(req.body,"request");
      const { name, email, password, phone, role = '',restaurantId,deliCompanyId, address } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email' 
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role,
        restaurantId,
        deliCompanyId,
        address
      });

      await user.save();

      // Generate token
      const token = generateToken(user);
      await RecentActivities.create({
            action: "Created New User",
            userId: user._id, // actor
            target: user._id       // updated profile
          });
      // Store session in Redis
      await setSession(token, user._id.toString());

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Registration failed', 
        error: error.message 
      });
    }
  }


  static async delistaffregister(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }
      console.log(req.body,"request");
      const { name, email, password, phone, role,restaurantId,deliCompanyId,address } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email' 
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role,
        restaurantId,
        deliCompanyId,
        address
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Store session in Redis
      await setSession(token, user._id.toString());

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Registration failed', 
        error: error.message 
      });
    }
  }













static async login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials log'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials pass'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    await setSession(token, user._id.toString());
    const userData = {  
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar || null,
      restaurantId: user.restaurantId || null,
      deliCompanyId: user.deliCompanyId || null,
      lastLogin: user.lastLogin
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
}


  static async googleSignIn(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { credential } = req.body;

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      // Check if user exists
      let user = await User.findOne({ 
        $or: [{ email }, { googleId }] 
      });

      if (user) {
        // Update existing user
        if (!user.googleId) {
          user.googleId = googleId;
        }
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = new User({
          name,
          email,
          googleId,
          avatar: picture,
          role: 'customer',
          emailVerified: true,
          lastLogin: new Date()
        });
        await user.save();
      }

      // Generate token
      const token = generateToken(user);

      // Store session in Redis
      await setSession(token, user._id.toString());

      res.json({
        message: 'Google sign in successful',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      res.status(500).json({ 
        message: 'Google sign in failed', 
        error: error.message 
      });
    }
  }

  static async firebaseAuth(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { idToken } = req.body;

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);
      const { uid: firebaseUid, email, name, picture } = decodedToken;

      // Check if user exists
      let user = await User.findOne({ 
        $or: [{ email }, { firebaseUid }] 
      });

      if (user) {
        // Update existing user
        if (!user.firebaseUid) {
          user.firebaseUid = firebaseUid;
        }
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = new User({
          name: name || email.split('@')[0],
          email,
          firebaseUid,
          avatar: picture,
          role: 'customer',
          emailVerified: true,
          lastLogin: new Date()
        });
        await user.save();
      }

      // Generate token
      const token = generateToken(user);

      // Store session in Redis
      await setSession(token, user._id.toString());

      res.json({
        message: 'Firebase auth successful',
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Firebase auth error:', error);
      res.status(500).json({ 
        message: 'Firebase auth failed', 
        error: error.message 
      });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Remove session from Redis
        await deleteSession(token);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        message: 'Logout failed', 
        error: error.message 
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({ message: 'Token is required' });
      }

      // Verify current token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Generate new token
      const newToken = generateToken(decoded.userId);

      // Update session in Redis
      await deleteSession(token);
      await setSession(newToken, decoded.userId);

      res.json({
        message: 'Token refreshed successfully',
        token: newToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ 
        message: 'Token refresh failed', 
        error: error.message 
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ 
          message: 'If the email exists, a password reset link has been sent' 
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id, type: 'password-reset' }, 
        config.jwtSecret, 
        { expiresIn: '1h' }
      );

      // Store reset token in Redis with 1 hour expiry
      await setSession(`reset:${resetToken}`, user._id.toString(), 3600);

      // TODO: Send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ 
        message: 'Password reset failed', 
        error: error.message 
      });
    }
  }
}

module.exports = AuthController;
