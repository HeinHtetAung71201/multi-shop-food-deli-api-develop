
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  // orderId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Order'
  //  },
  rating: {
    food: { type: Number, required: true, min: 1, max: 5 },
    service: { type: Number, required: true, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    overall: { type: Number, required: true, min: 1, max: 5 }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  images: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  response: {
    message: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });
//reviewSchema.index({ orderId: 1 });
reviewSchema.index({ 'rating.overall': -1 });

module.exports = mongoose.model('Review', reviewSchema);
