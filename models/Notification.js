
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order_status', 'delivery', 'payment', 'promotion', 'emergency', 'chat', 'system', 'bulk'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentByName: String,
    sentByRole: String,
    channel: {
      type: String,
      enum: ['push', 'socket', 'email', 'sms'],
      default: 'push'
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    deliveredAt: Date,
    failureReason: String
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.metadata.deliveryStatus = 'delivered';
  this.metadata.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(reason) {
  this.metadata.deliveryStatus = 'failed';
  this.metadata.failureReason = reason;
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.deleteOld = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

notificationSchema.statics.createOrderNotification = function(userId, orderId, status, message) {
  return this.create({
    userId,
    type: 'order_status',
    title: 'Order Update',
    message,
    data: { orderId, status },
    priority: status === 'delivered' || status === 'cancelled' ? 'high' : 'normal'
  });
};

notificationSchema.statics.createEmergencyNotification = function(userId, message, data = {}) {
  return this.create({
    userId,
    type: 'emergency',
    title: '🚨 Emergency Alert',
    message,
    priority: 'urgent',
    data
  });
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set expiration for low priority notifications
  if (this.priority === 'low' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  // Set expiration for promotional notifications
  if (this.type === 'promotion' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
