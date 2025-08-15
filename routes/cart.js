const express = require('express');
const { auth } = require('../middleware/auth');
const CartController = require('../controllers/cartController');
console.log(CartController.addItem, "CartController loaded");
const router = express.Router();

// Get user cart
router.get('/', auth, CartController.getCart);

//GET all cart by user Id
router.get('/items/user/:userId', auth, CartController.getAllCartByUserId);

// Add item to cart
router.post('/items', auth, CartController.addItem);

// Update cart item quantity
router.put('/items/:itemId', auth, CartController.updateItem);

// Remove item from cart
router.delete('/customer/:customerId/items/:itemId', auth, CartController.removeItem);

// Clear cart
router.delete('/customer/:customerId', auth, CartController.clearCart);

module.exports = router;