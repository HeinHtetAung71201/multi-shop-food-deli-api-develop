const express = require('express');
const { auth } = require('../middleware/auth');
const PaymentController = require('../controllers/paymentController');

const router = express.Router();

// Get user payment methods
router.get('/methods', auth, PaymentController.getUserPaymentMethods);

// Add payment method
router.post('/methods', auth, PaymentController.addPaymentMethod);

// Process payment
router.post('/process', auth, PaymentController.processPayment);

module.exports = router;