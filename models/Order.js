const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  menuItemId: {  
    type: Schema.Types.ObjectId,   // This will store the embedded menu item's _id
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  variant: String,
  notes: String,
  customizations: [{
    name: String,
    price: Number
  }]
});

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: false
  }, 
  customerPhone:{
    type: Number,
  },
  customerAddress:{
    type:String
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [orderItemSchema],   // Each item references the menuItemId from restaurant.menu

  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    // tax: { type: Number, required: true, min: 0 },
    // discount: { type: Number, default: 0, min: 0 },
    // tip: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },

  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'preparing',
      'ready',
      'assigned',
      'picked-up',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'refunded',
      'completed'

    ],
    default: 'pending'
  },


  // Changed the deliveryService field to deliveryCompanyId
  
// deliveryService:{
//   type: Schema.Types.ObjectId,
//   ref: 'DeliveryCompany',
//   required: true
// },

 deliverType: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: false
  },

 deliveryAddress: {

   street:{type: String,}
 },
 
  deliveryCompanyId:{
    type: Schema.Types.ObjectId,
    ref: 'DeliveryCompany',
    required: false
  },

  customerInfo: {
    name: String,
    phone: String,
    email: String
  },

  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'cash', 'digital_wallet'],
      required: true
    },
    cardLast4: String,
    transactionId: String,
    isPaid: { type: Boolean, default: false }
  },

  assignedStaffId: {
    type: Schema.Types.ObjectId,
    ref: 'Staff',
    required: false
  },

  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  estimatedTimes: {
    preparation: Number,
    delivery: Number,
    pickup: Number
  },

  actualTimes: {
    accepted: Date,
    prepared: Date,
    pickedUp: Date,
    delivered: Date
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  specialInstructions: String,
  promoCode: String,

  rating: {
    food: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },

  refund: {
    isRefunded: { type: Boolean, default: false },
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },

  cancellation: {
    reason: String,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    refundAmount: Number
  },

  trackingInfo: {
    currentLocation: {
      lat: Number,
      lng: Number,
      timestamp: Date
    },
    estimatedArrival: Date,
    deliveryRoute: [{
      lat: Number,
      lng: Number,
      timestamp: Date
    }]
  }
}, { timestamps: true });

// Pre-save order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
