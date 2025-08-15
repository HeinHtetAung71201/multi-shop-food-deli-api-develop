
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  address: String,
  vehicleType: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  rating: { type: Number, default: 0 },
  deliveries: { type: Number, default: 0 },
  joinedDate: { type: Date },
  employeeId:String,
  activeOrders: { type: Number, default: 0 }
});

module.exports = mongoose.model('Staff', staffSchema);
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   employeeId: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   vehicleType: {
//     type: String,
//     enum: ['bike', 'motorcycle', 'car', 'van', 'walking'],
//     required: true
//   },
//   vehicleDetails: {
//     make: String,
//     model: String,
//     year: Number,
//     licensePlate: String,
//     color: String,
//     insuranceNumber: String,
//     registrationNumber: String
//   },
//   licenseInfo: {
//     driverLicenseNumber: String,
//     licenseExpiry: Date,
//     licenseVerified: { type: Boolean, default: false }
//   },
//   workingHours: {
//     monday: { start: String, end: String, isWorking: Boolean },
//     tuesday: { start: String, end: String, isWorking: Boolean },
//     wednesday: { start: String, end: String, isWorking: Boolean },
//     thursday: { start: String, end: String, isWorking: Boolean },
//     friday: { start: String, end: String, isWorking: Boolean },
//     saturday: { start: String, end: String, isWorking: Boolean },
//     sunday: { start: String, end: String, isWorking: Boolean }
//   },
//   currentStatus: {
//     type: String,
//     enum: ['offline', 'online', 'busy', 'on-delivery', 'break'],
//     default: 'offline'
//   },
//   currentLocation: {
//     lat: Number,
//     lng: Number,
//     timestamp: Date
//   },
//   activeOrders: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Order'
//   }],
//   maxConcurrentOrders: {
//     type: Number,
//     default: 3,
//     min: 1,
//     max: 10
//   },
//   performance: {
//     totalDeliveries: { type: Number, default: 0 },
//     completedDeliveries: { type: Number, default: 0 },
//     cancelledDeliveries: { type: Number, default: 0 },
//     averageDeliveryTime: { type: Number, default: 0 }, // in minutes
//     onTimeDeliveryRate: { type: Number, default: 0 }, // percentage
//     customerRating: {
//       average: { type: Number, default: 0, min: 0, max: 5 },
//       count: { type: Number, default: 0 }
//     },
//     totalEarnings: { type: Number, default: 0 },
//     totalDistance: { type: Number, default: 0 }, // in kilometers
//     workingHoursTotal: { type: Number, default: 0 } // in hours
//   },
//   availability: {
//     isAvailable: { type: Boolean, default: true },
//     unavailableReason: String,
//     unavailableUntil: Date
//   },
//   emergencyContact: {
//     name: String,
//     phone: String,
//     relationship: String
//   },
//   bankDetails: {
//     accountNumber: String,
//     routingNumber: String,
//     accountHolderName: String,
//     bankName: String
//   },
//   documents: {
//     profilePhoto: String,
//     idDocument: String,
//     driverLicense: String,
//     vehicleRegistration: String,
//     insurance: String,
//     backgroundCheck: {
//       status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//       completedAt: Date,
//       document: String
//     }
//   },
//   verificationStatus: {
//     isVerified: { type: Boolean, default: false },
//     verifiedAt: Date,
//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     rejectionReason: String
//   },
//   workHistory: [{
//     date: Date,
//     hoursWorked: Number,
//     deliveriesCompleted: Number,
//     earnings: Number,
//     rating: Number
//   }],
//   deliveryZones: [{
//     name: String,
//     coordinates: [[Number]], // Polygon coordinates
//     isActive: Boolean
//   }],
//   preferences: {
//     pushNotifications: { type: Boolean, default: true },
//     smsNotifications: { type: Boolean, default: true },
//     emailNotifications: { type: Boolean, default: true },
//     autoAcceptOrders: { type: Boolean, default: false },
//     preferredDeliveryRadius: { type: Number, default: 10 } // in kilometers
//   }
// }, {
//   timestamps: true
// });

// // Pre-save middleware to generate employee ID
// staffSchema.pre('save', async function(next) {
//   if (!this.employeeId) {
//     const count = await mongoose.model('Staff').countDocuments();
//     this.employeeId = `EMP-${String(count + 1).padStart(6, '0')}`;
//   }
//   next();
// });

// // Indexes
// staffSchema.index({ userId: 1 });
// staffSchema.index({ employeeId: 1 });
// staffSchema.index({ currentStatus: 1 });
// staffSchema.index({ 'currentLocation': '2dsphere' });

// module.exports = mongoose.model('Staff', staffSchema);
