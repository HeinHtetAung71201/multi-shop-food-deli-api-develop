const express = require('express');
const { auth } = require('../middleware/auth');
const DeliveryController = require('../controllers/deliveryController');

const router = express.Router();

// Get delivery assignments
router.get('/assignments', auth, DeliveryController.getDeliveryAssignments);

// Update delivery status
router.put('/orders/:orderId/status', auth, DeliveryController.updateDeliveryStatus);

// Get delivery statistics
router.get('/stats', auth, DeliveryController.getDeliveryStats);

module.exports = router;