
const Notification = require('../models/Notification');

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const skip = (page - 1) * limit;
      
      let query = { userId: req.user.id };
      if (unreadOnly === 'true') {
        query.isRead = false;
      }
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId: req.user.id,
        isRead: false
      });
      
      res.json({
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async deleteNotification(req, res) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createNotification(req, res) {
    try {
      const notificationData = req.body;
      const notification = new Notification(notificationData);
      await notification.save();
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const count = await Notification.countDocuments({
        userId: req.user.id,
        isRead: false
      });
      
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async bulkCreate(notifications) {
    try {
      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Bulk create notifications error:', error);
      throw error;
    }
  }
}

module.exports = NotificationController;
