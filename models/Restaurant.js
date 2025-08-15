
const mongoose = require('mongoose');
const {Schema}=mongoose;
const SizeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const AdditionalItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});
const menuItemSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Restaurant',
      required: true
    },
    // image: {
    //   type: String,
    // //   required: true, // path or URL of image
    // },
    storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    publicImgUrl: {
        type: String,
    },
    sizes: [SizeSchema],
    additionalItems: [AdditionalItemSchema],
  },{
    timestamps: true, // adds createdAt and updatedAt
  })




const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // image: {
  //   type: String,
    
  // },
  images: [String], // Additional images
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true},
  // cuisine: [String], // e.g., ['Italian', 'Mediterranean']
  // rating: {
  //   average: { type: Number, default: 0, min: 0, max: 5 },
  //   count: { type: Number, default: 0 }
  // },
  // deliveryTime: {
  //   min: { type: Number, required: true },
  //   max: { type: Number, required: true }
  // },
  openTime:{
    type: String,
    required:false,
  },
  closeTime:{
    type: String,
    required: false,
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
   storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    publicImgUrl: {
        type: String,
    },
  // minimumOrder: {
  //   type: Number,
  //   required: true,
  //   min: 0
  // },
  isOpen: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  address: {
    street: { type: String, required: true },
    // city: { type: String, required: true },
    // state: { type: String, required: true },
    // zipCode: { type: String, required: true },
    // coordinates: {
    //   lat: { type: Number, required: true },
    //   lng: { type: Number, required: true }
    // }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  // contact: {
  //   phone: { type: String, required: true },
  //   email: { type: String, required: true },
  //   website: String
  // },
  // operatingHours: {
  //   monday: { open: String, close: String, isClosed: Boolean },
  //   tuesday: { open: String, close: String, isClosed: Boolean },
  //   wednesday: { open: String, close: String, isClosed: Boolean },
  //   thursday: { open: String, close: String, isClosed: Boolean },
  //   friday: { open: String, close: String, isClosed: Boolean },
  //   saturday: { open: String, close: String, isClosed: Boolean },
  //   sunday: { open: String, close: String, isClosed: Boolean }
  // },
  menu: [menuItemSchema],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // staff: [{
  //   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  //   role: { type: String, enum: ['manager', 'chef', 'cashier'] },
  //   joinedAt: { type: Date, default: Date.now }
  // }],
  // deliveryZones: [{
  //   name: String,
  //   coordinates: [[Number]], // Polygon coordinates
  //   deliveryFee: Number,
  //   minimumOrder: Number
  // }],
  // features: {
  //   hasDelivery: { type: Boolean, default: true },
  //   hasPickup: { type: Boolean, default: true },
  //   acceptsCash: { type: Boolean, default: true },
  //   acceptsCard: { type: Boolean, default: true },
  //   acceptsDigitalPayment: { type: Boolean, default: true }
  // },
  // statistics: {
  //   totalOrders: { type: Number, default: 0 },
  //   totalRevenue: { type: Number, default: 0 },
  //   averageOrderValue: { type: Number, default: 0 },
  //   completionRate: { type: Number, default: 0 }
  // },
  // isVerified: {
  //   type: Boolean,
  //   default: false
  // },
  // verificationDocuments: [String],
  // tags: [String],
  // promotions: [{
  //   title: String,
  //   description: String,
  //   discountType: { type: String, enum: ['percentage', 'fixed'] },
  //   discountValue: Number,
  //   minimumOrder: Number,
  //   validFrom: Date,
  //   validTo: Date,
  //   isActive: Boolean,
  //   usageLimit: Number,
  //   usageCount: { type: Number, default: 0 }
  // }]
}, {
  timestamps: true
});

// Indexes for better performance
restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ category: 1, isOpen: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
