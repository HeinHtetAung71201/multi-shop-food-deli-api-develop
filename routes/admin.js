const express = require('express');
const { auth } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

const router = express.Router();

// Get dashboard statistics
// router.get('/dashboard/:deliCompanyId?', auth, AdminController.getDashboardStats);

router.get('/dashboard', auth, AdminController.getDashboardStats);
router.get('/dashboard/deliCompany/:deliCompanyId', auth, AdminController.getDashboardStats);
router.get('/dashboard/restaurant/:restaurantId', auth, AdminController.getDashboardStats);

// Get all users
router.get('/users', auth, AdminController.getAllUsers);

// Update user role
router.put('/users/:id/role', auth, AdminController.updateUserRole);

module.exports = router;