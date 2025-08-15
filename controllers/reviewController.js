
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

class ReviewController {
  static async getReviews(req, res) {
    try {
      const { restaurantId, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      let query = { status: 'approved', isPublic: true };
      if (restaurantId) {
        query.restaurantId = restaurantId;
      }
      
      const reviews = await Review.find(query)
        .populate('customerId', 'name avatar')
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Review.countDocuments(query);
      
      res.json({
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getAllReviews(req, res) {
  try {
    const reviews = await Review.find()
      .populate('restaurantId', 'name') // only fetch 'name' from restaurant
      .populate('customerId', 'name');  // optional: fetch customer name too

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// flagReview
static async flagReview(req, res) {
  try {
    const reviewId = req.params.reviewId;
    console.log(req.params.reviewId,"<<<<<<requested data")

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'flagged' },
      { new: true } // return the updated document
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review flagged successfully', review: updatedReview });
  } catch (error) {
    console.error('Flagged reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


  static async createReview(req, res) {
    try {
      const reviewData = {
        ...req.body,
        customerId: req.user.id
      };console.log(reviewData);
      
      // Check if user already reviewed this restaurant
      const existingReview = await Review.findOne({
        customerId: req.user.id,
        restaurantId: reviewData.restaurantId
      });
      
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this restaurant' });
      }
      
      ;
      const review = new Review(reviewData);
      await review.save();

      const response = await ReviewController.updateRestaurantRating(review.restaurantId)
      
      // Update restaurant rating
    //  await this.updateRestaurantRating(reviewData.restaurantId);
      
      // const populatedReview = await Review.findById(review._id)
      //   .populate('customerId', 'name avatar')
      //   .populate('restaurantId', 'name');
      
      res.status(201).json(review);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Server error', error: error.message});
    }
  }

  static async updateReview(req, res) {
    try {
      const review = await Review.findOneAndUpdate(
        { _id: req.params.id, customerId: req.user.id },
        req.body,
        { new: true, runValidators: true }
      ).populate('customerId', 'name avatar');
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found or unauthorized' });
      }
      

      console.log('reviewId<<',review.restaurantId);
      
      // Update restaurant rating
      await ReviewController.updateRestaurantRating(review.restaurantId);
;
      
      res.json(review);
    } catch (error) {
      console.log('Update review error:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async deleteReview(req, res) {
    const reviewId= req.params.reviewId;
    console.log(reviewId,"This is review Id <<<<<<");
    try {
      const review = await Review.findOneAndDelete({
        _id: reviewId,
      });
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found or unauthorized' });
      }
      
      // Update restaurant rating
      // await this.updateRestaurantRating(review.restaurantId);
      
      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateRestaurantRating(restaurantId) {
    try {
      const reviews = await Review.find({
        restaurantId,
        status: 'approved',
        isPublic: true
      });
      
      if (reviews.length === 0) {
        await Restaurant.findByIdAndUpdate(restaurantId, {
          'rating.average': 0,
          'rating.count': 0
        });
        return;
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating.overall, 0);
      const averageRating = totalRating / reviews.length;
      
      console.log('Average rating:', averageRating);
      
        const response= await Restaurant.findByIdAndUpdate(restaurantId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': reviews.length
        },
        {
        new: true,           // return the updated document
        runValidators: true  // enforce schema rules
        }
    );

      console.log('Restaurant rating updated:', response);

    } catch (error) {
      console.error('Update restaurant rating error:', error);
    }
  }

  static async respondToReview(req, res) {
    try {
      const { message } = req.body;
      
      const review = await Review.findByIdAndUpdate(
        req.params.id,
        {
          response: {
            message,
            respondedAt: new Date(),
            respondedBy: req.user.id
          }
        },
        { new: true }
      ).populate('customerId', 'name avatar');
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      res.json(review);
    } catch (error) {
      console.error('Respond to review error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = ReviewController;
