const express = require('express');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');

const router = express.Router();

//Get All user
router.get('/getAllusers',auth, UserController.getAllUser);

//get all user by deliCompanyId
router.get('/getAllusers/:deliCompanyId',auth, UserController.getAllStaffByCompanyId);
// Get user profile
router.get('/profile/:id', auth, UserController.getProfile);

// Update user profile
router.put('/profile/:id', auth, UserController.updateProfile);

//delete User
router.delete('/profile/:id',auth,UserController.deleteProfile);

//getAllStaff by comanyId
router.get('/getAllStaff/:companyId', auth, UserController.getAllStaffByCompanyId);

//getAllStaffs by deliCompanyId
router.get('/getAllStaffs/:companyId', auth, UserController.getAllStaffsByCompanyId);


// Change password
router.put('/change-password/:userId', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New Password is required'),
  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
], UserController.changePassword);

module.exports = router;