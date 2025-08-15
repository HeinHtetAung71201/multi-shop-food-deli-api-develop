
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    //required: true
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId, // reference embedded _id
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites
// favoriteSchema.index(
//   { customerId: 1, menuItemId: 1 },
//   {
//     unique: true,
//     sparse: true, // only applies uniqueness when menuItemId is present
//   }
// );

// favoriteSchema.index(
//   { customerId: 1, restaurantId: 1 },
//   {
//     // unique: true,
//     sparse: true, // only applies uniqueness when restaurantId is present
//   }
// );


//favoriteSchema.index({ customerId: 1, menuItemId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

