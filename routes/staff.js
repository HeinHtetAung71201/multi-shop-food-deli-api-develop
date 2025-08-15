const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const StaffController = require('../controllers/staffController');

const router = express.Router();

// Get all staff members
// router.get('/',StaffController.getAllStaff);

//Get all assigned staff members
// router.get('/assigned', auth, StaffController.getAssignedStaff);

// Create staff member
// router.post('/',StaffController.createStaff);

// Update staff status
// router.put('/:id',StaffController.updateStaff);

// router.delete('/:id',StaffController.deleteStaff);

module.exports = router;