
const express = require('express');
const { auth } = require('../middleware/auth');
const MenuController = require('../controllers/menuController');
const { imageUpload } = require('../middleware/imageUpload');

const router = express.Router();

// Get all menu items
router.get('/', MenuController.getAllMenuItems);
// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', MenuController.getMenuByRestaurant);

// Add menu item
router.post('/restaurant/:restaurantId', auth, imageUpload, MenuController.addMenuItem);

// Update menu item
router.put('/restaurant/:restaurantId/item/:itemId', auth,imageUpload, MenuController.updateMenuItem);

router.delete('/restaurant/:restaurantId/item/:itemId', auth, MenuController.deleteMenuItem);

module.exports = router;
