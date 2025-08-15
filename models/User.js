
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// const addressSchema = new mongoose.Schema({
//   label: { type: String, required: true },
//   street: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   zipCode: { type: String, required: true },
//   coordinates: {
//     lat: Number,
//     lng: Number
//   },
//   isDefault: { type: Boolean, default: false }
// });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
    }
  },
  role: {
    type: String,
    enum: ['customer', 'shop-admin', 'deli-admin', 'deli-staff', 'super-admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  address: {
     type: String,
     required: false,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false
  },
  deliCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryCompany',
    required: false
  },
  googleId: String,
  firebaseUid: String,
  lastLogin: Date,
  deviceTokens: [String], // For push notifications
  preferences: {
    notifications: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  try{
  if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.googleId;
  delete user.firebaseUid;
  delete user.deviceTokens;
  return user;
};

module.exports = mongoose.model('User', userSchema);
