const express = require('express');
const { auth } = require('../middleware/auth');
const FavoriteController = require('../controllers/favoriteController');

const router = express.Router();

// Get all favorites
// router.get('/', auth, FavoriteController.getFavorites);

//Get all user's favorites
router.get('/user/:customerId',auth,FavoriteController.getFavoritesByUser);
router.get('/res/:customerId', auth ,FavoriteController.getFavorite);

// Add to favorites
router.post('/', auth, FavoriteController.addFavoriteToFood);
router.post('/restaurantfavorite',auth ,FavoriteController.addFavoriteToRestaurant);

// Remove from favorites
router.delete('/:menuItemId', auth, FavoriteController.removeFavorite);
router.delete('/restaurant/:restaurantId', auth, FavoriteController.removeFavoriteRes);


module.exports = router;