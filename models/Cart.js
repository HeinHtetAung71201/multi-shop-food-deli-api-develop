const mongoose = require('mongoose');

// --- Cart Item Schema ---
const cartItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
    restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  image: String,
  variant: String,
  customizations: [{
    name: String,
    price: { type: Number, default: 0 }
  }],
  specialInstructions: String,
  totalPrice: { type: Number, required: true }
}, { _id: false });

// --- Main Cart Schema ---
const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totals: {
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  promoCode: String,
 deliveryAddress: {
  type: String,
  required: true,
},
  deliveryType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// --- Pre-save hook to calculate totals ---
cartSchema.pre('save', function (next) {
  const subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = this.deliveryType === 'delivery' ? 5.99 : 0;
  const discount = this.totals?.discount || 0;

  this.totals.subtotal = subtotal;
  this.totals.tax = tax;
  this.totals.deliveryFee = deliveryFee;
  this.totals.discount = discount;
  this.totals.total = subtotal + tax + deliveryFee - discount;

  next();
});

// --- TTL Index for automatic cart expiration ---
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// --- Fast access to customer ---
cartSchema.index({ customerId: 1 });

// --- Export model ---
module.exports = mongoose.model('Cart', cartSchema);
