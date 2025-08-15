const express = require('express');
const { auth } = require('../middleware/auth');
const ReviewController = require('../controllers/reviewController');

const router = express.Router();

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', ReviewController.getReviews);

//Get all reviews
router.get('/getAllreviews',auth,ReviewController.getAllReviews)

//Flagged Reviews
router.put('/flagged/:reviewId',ReviewController.flagReview)

//Delete Reviews
router.delete('/:reviewId',ReviewController.deleteReview)

router.put('/:id', auth, ReviewController.updateReview);

// Create review
router.post('/', auth, ReviewController.createReview);

module.exports = router;