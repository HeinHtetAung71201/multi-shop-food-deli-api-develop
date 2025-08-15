const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const mongoose = require('mongoose');
const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('address')
    .optional() // make address optional
    .isLength({ min: 6 })
    .withMessage('Address must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'shop-admin', 'deli-admin','deli-staff']).withMessage('Invalid role'),
  body('restaurantId')
    .optional()
    .custom(value => {
      if (!value || value === 'N/A') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid restaurantId');
      }
      return true;
    }),

  body('deliCompanyId')
    .optional()
    .custom(value => {
      if (!value || value === 'N/A') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid deliCompanyId');
      }
      return true;
    }),
], AuthController.register);



router.post('/delistaffregister', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // body('role').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  // body('restaurantId')
  //   .optional()
  //   .custom(value => {
  //     if (!value || value === 'N/A') return true;
  //     if (!mongoose.Types.ObjectId.isValid(value)) {
  //       throw new Error('Invalid restaurantId');
  //     }
  //     return true;
  //   }),

  // body('deliCompanyId')
  //   .optional()
  //   .custom(value => {
  //     if (!value || value === 'N/A') return true;
  //     if (!mongoose.Types.ObjectId.isValid(value)) {
  //       throw new Error('Invalid deliCompanyId');
  //     }
    //   return true;
    // }),
], AuthController.delistaffregister);














// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], AuthController.login);

// Google Sign In
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required')
], AuthController.googleSignIn);

// Firebase Auth (for mobile apps)
router.post('/firebase', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required')
], AuthController.firebaseAuth);

// Logout
router.post('/logout', AuthController.logout);

// Refresh token
router.post('/refresh', AuthController.refreshToken);

// Password reset request
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], AuthController.forgotPassword);

module.exports = router;