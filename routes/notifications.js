
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendPushNotification } = require('../config/firebase');
const { setFCMToken, getFCMToken, addToNotificationQueue } = require('../config/redis');
const config = require('../config/config');


// Save FCM token
router.post('/save-fcm-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Update user's FCM token
    await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
    
    // Store in Redis for quick access
    await setFCMToken(req.user.id, token);
    
    res.json({ message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { userId: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send bulk notification (admin only)
router.post('/bulk', auth, authorize('super-admin', 'deli-admin'), async (req, res) => {
  try {
    const { title, message, targetRoles, targetUsers, priority = 'normal' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    let recipients = [];
    
    // Get users by roles
    if (targetRoles && targetRoles.length > 0) {
      const roleUsers = await User.find({
        role: { $in: targetRoles },
        isActive: true
      });
      recipients = recipients.concat(roleUsers);
    }
    
    // Get specific users
    if (targetUsers && targetUsers.length > 0) {
      const specificUsers = await User.find({
        _id: { $in: targetUsers },
        isActive: true
      });
      recipients = recipients.concat(specificUsers);
    }
    
    // Remove duplicates
    recipients = recipients.filter((user, index, self) => 
      index === self.findIndex(u => u._id.toString() === user._id.toString())
    );
    
    // Create notifications
    const notifications = recipients.map(user => ({
      userId: user._id,
      type: 'system',
      title,
      message,
      priority,
      data: {
        sentBy: req.user.id,
        sentByName: req.user.name,
        sentByRole: req.user.role
      }
    }));
    
    await Notification.insertMany(notifications);
    
    // Send push notifications
    const fcmTokens = recipients
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken);
    
    if (fcmTokens.length > 0) {
      await sendPushNotification(
        fcmTokens,
        { title, body: message, icon: '/icon192.png' },
        { type: 'bulk_notification', priority }
      );
    }
    
    res.json({ 
      message: 'Bulk notification sent successfully',
      recipientCount: recipients.length
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings');
    
    const defaultSettings = {
      orderUpdates: true,
      promotions: true,
      emergencyAlerts: true,
      chatMessages: true,
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true
    };
    
    res.json(user.notificationSettings || defaultSettings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.patch('/settings', auth, async (req, res) => {
  try {
    const settings = req.body;
    
    await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: settings },
      { new: true }
    );
    
    res.json({ message: 'Notification settings updated', settings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test notification (development only)
if (config.nodeEnv === 'development') {
  router.post('/test', auth, async (req, res) => {
    try {
      const { title = 'Test Notification', message = 'This is a test notification' } = req.body;
      
      const notification = new Notification({
        userId: req.user.id,
        type: 'system',
        title,
        message,
        priority: 'normal',
        data: { test: true }
      });
      
      await notification.save();
      
      // Send push notification if FCM token exists
      const user = await User.findById(req.user.id);
      if (user.fcmToken) {
        await sendPushNotification(
          user.fcmToken,
          { title, body: message, icon: '/icon192.png' },
          { type: 'test', notificationId: notification._id }
        );
      }
      
      res.json({ message: 'Test notification sent', notification });
    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}

module.exports = router;
