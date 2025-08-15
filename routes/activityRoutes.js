const express = require('express');
const { auth } = require('../middleware/auth');
const ActivityController = require('../controllers/ActivityController');

const router = express.Router();

// GET recent activities
router.get('/recent',  ActivityController.getRecentActivities);

// POST new activity (optional - usually internal)
// router.post('/', auth, ActivityController.createActivity);

module.exports = router;
