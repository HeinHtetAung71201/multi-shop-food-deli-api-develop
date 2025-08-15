const express = require('express');
const { auth } = require('../middleware/auth');
const { imageUpload } = require('../middleware/imageUpload');

const RestaurantController = require('../controllers/restaurantController');
// const { imageUpload } = require('../middleware/imageUpload');

const router = express.Router();

// Get all restaurants
router.get('/', RestaurantController.getRestaurants);

// Get restaurant by ID
router.get('/:id', RestaurantController.getRestaurantById);

// Create restaurant (admin only)
router.post('/', auth, imageUpload, RestaurantController.createRestaurant);

// Update restaurant
router.put('/:id', auth, imageUpload, RestaurantController.updateRestaurant);

router.delete('/:id', auth, RestaurantController.deleteRestaurant);

module.exports = router;