
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { getSession, setDriverLocation, getDriverLocation, setUserStatus, getUserStatus } = require('../config/redis');
const { sendPushNotification } = require('../config/firebase');
const config = require('../config/config');

const socketHandler = (io) => {
  // Store connected users for efficient tracking
  const connectedUsers = new Map();
  const userSockets = new Map();

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecretS);
      const sessionUserId = await getSession(token);
      
      if (!sessionUserId || sessionUserId !== decoded.userId) {
        return next(new Error('Authentication error: Invalid session'));
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;
      socket.token = token;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} (${socket.userRole}) connected`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      role: socket.userRole,
      lastSeen: new Date(),
      status: 'online'
    });

    // Map socket to user for easy lookup
    userSockets.set(socket.id, socket.userId);

    // Set user online status in Redis
    await setUserStatus(socket.userId, 'online');

    // Join user-specific rooms
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);

    // Role-specific room joining
    if (socket.userRole === 'shop-admin' && socket.user.shopId) {
      socket.join(`restaurant:${socket.user.shopId}`);
    }

    if (socket.userRole === 'deli-staff') {
      socket.join('delivery-staff');
    }

    // Broadcast user online status
    socket.broadcast.emit('user-status-changed', {
      userId: socket.userId,
      status: 'online',
      timestamp: new Date()
    });

    // Send pending notifications
    await sendPendingNotifications(socket);

    // Handle heartbeat for connection monitoring
    socket.on('heartbeat', () => {
      if (connectedUsers.has(socket.userId)) {
        connectedUsers.get(socket.userId).lastSeen = new Date();
      }
    });

    // Handle order tracking
    socket.on('track-order', async (data) => {
      try {
        const { orderId } = data;
        
        const order = await Order.findById(orderId)
          .populate('customerId', 'name phone')
          .populate('restaurantId', 'name address')
          .populate('assignedStaffId', 'name phone');

        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        const canTrack = 
          socket.userRole === 'super-admin' ||
          socket.userRole === 'deli-admin' ||
          (socket.userRole === 'customer' && order.customerId._id.toString() === socket.userId) ||
          (socket.userRole === 'shop-admin' && order.restaurantId._id.toString() === socket.user.shopId?.toString()) ||
          (socket.userRole === 'deli-staff' && order.assignedStaffId?._id.toString() === socket.userId);

        if (!canTrack) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        socket.join(`order:${orderId}`);
        
        // Get real-time driver location if available
        let driverLocation = null;
        if (order.assignedStaffId) {
          driverLocation = await getDriverLocation(order.assignedStaffId._id.toString());
        }

        socket.emit('order-tracking-data', {
          orderId,
          order: {
            id: order._id,
            status: order.status,
            timeline: order.timeline,
            estimatedTimes: order.estimatedTimes,
            actualTimes: order.actualTimes,
            trackingInfo: order.trackingInfo,
            customer: order.customerId,
            restaurant: order.restaurantId,
            assignedStaff: order.assignedStaffId,
            driverLocation
          }
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle driver location updates with enhanced features
    socket.on('update-location', async (data) => {
      try {
        if (socket.userRole !== 'deli-staff') {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { lat, lng, accuracy, speed, heading } = data;
        
        if (!lat || !lng) {
          return socket.emit('error', { message: 'Invalid location data' });
        }

        const locationData = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
          timestamp: new Date()
        };

        // Store location in Redis with expiration
        await setDriverLocation(socket.userId, locationData);

        // Get active orders for this driver
        const activeOrders = await Order.find({
          assignedStaffId: socket.userId,
          status: { $in: ['assigned', 'picked-up', 'out-for-delivery'] }
        });

        // Broadcast location to customers tracking their orders
        activeOrders.forEach(order => {
          io.to(`order:${order._id}`).emit('driver-location-update', {
            orderId: order._id,
            driverId: socket.userId,
            location: locationData
          });
        });

        // Broadcast to admin dashboards
        io.to('role:deli-admin').to('role:super-admin').emit('staff-location-update', {
          staffId: socket.userId,
          staffName: socket.user.name,
          location: locationData,
          activeOrders: activeOrders.length
        });

        socket.emit('location-update-confirmed', { timestamp: locationData.timestamp });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Enhanced order status updates
    socket.on('update-order-status', async (data) => {
      try {
        const { orderId, status, note, estimatedTime } = data;
        
        const order = await Order.findById(orderId)
          .populate('customerId', 'name fcmToken')
          .populate('restaurantId', 'name')
          .populate('assignedStaffId', 'name');

        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        const canUpdate = 
          socket.userRole === 'super-admin' ||
          socket.userRole === 'deli-admin' ||
          (socket.userRole === 'shop-admin' && order.restaurantId._id.toString() === socket.user.shopId?.toString()) ||
          (socket.userRole === 'deli-staff' && order.assignedStaffId?._id.toString() === socket.userId);

        if (!canUpdate) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const previousStatus = order.status;
        order.status = status;
        
        const timelineEntry = {
          status,
          timestamp: new Date(),
          note,
          updatedBy: socket.userId,
          updatedByName: socket.user.name,
          updatedByRole: socket.userRole
        };

        order.timeline.push(timelineEntry);

        // Update actual times and estimated times
        const now = new Date();
        switch (status) {
          case 'accepted':
            order.actualTimes.accepted = now;
            if (estimatedTime) {
              order.estimatedTimes.prepared = new Date(now.getTime() + estimatedTime * 60000);
            }
            break;
          case 'preparing':
            order.actualTimes.preparing = now;
            break;
          case 'ready':
            order.actualTimes.prepared = now;
            if (estimatedTime) {
              order.estimatedTimes.pickedUp = new Date(now.getTime() + estimatedTime * 60000);
            }
            break;
          case 'picked-up':
            order.actualTimes.pickedUp = now;
            if (estimatedTime) {
              order.estimatedTimes.delivered = new Date(now.getTime() + estimatedTime * 60000);
            }
            break;
          case 'out-for-delivery':
            order.actualTimes.outForDelivery = now;
            break;
          case 'delivered':
            order.actualTimes.delivered = now;
            break;
          case 'cancelled':
            order.actualTimes.cancelled = now;
            break;
        }

        await order.save();

        // Create notification
        const notification = new Notification({
          userId: order.customerId._id,
          type: 'order_status',
          title: 'Order Update',
          message: `Your order #${order._id.toString().slice(-6)} is now ${status}`,
          data: {
            orderId: order._id,
            status,
            previousStatus
          }
        });
        await notification.save();

        // Broadcast update to all relevant parties
        const updateData = {
          orderId,
          status,
          previousStatus,
          timeline: order.timeline,
          actualTimes: order.actualTimes,
          estimatedTimes: order.estimatedTimes,
          updatedBy: {
            id: socket.userId,
            name: socket.user.name,
            role: socket.userRole
          },
          timestamp: now
        };

        io.to(`order:${orderId}`).emit('order-status-updated', updateData);

        // Send push notification to customer
        if (order.customerId.fcmToken) {
          await sendPushNotification(
            order.customerId.fcmToken,
            {
              title: 'Order Update',
              body: `Your order is now ${status}`,
              icon: '/icon192.png'
            },
            {
              orderId: orderId,
              status: status,
              type: 'order_status'
            }
          );
        }

        // Notify customer via socket
        io.to(`user:${order.customerId._id}`).emit('order-notification', {
          type: 'status-update',
          orderId,
          status,
          previousStatus,
          message: `Your order is now ${status}`,
          timestamp: now,
          notification
        });

        socket.emit('order-status-update-confirmed', { orderId, status, timestamp: now });

      } catch (error) {
        console.error('Order status update error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle new order creation with comprehensive notifications
    socket.on('new-order-created', async (data) => {
      try {
        const { orderId, restaurantId } = data;
        
        const order = await Order.findById(orderId)
          .populate('customerId', 'name')
          .populate('restaurantId', 'name');

        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        // Notify restaurant staff
        io.to(`restaurant:${restaurantId}`).emit('new-order-notification', {
          orderId,
          order: {
            id: order._id,
            customer: order.customerId,
            items: order.items,
            total: order.total,
            type: order.type,
            address: order.deliveryAddress
          },
          message: 'New order received',
          timestamp: new Date()
        });

        // Notify delivery admins
        io.to('role:deli-admin').to('role:super-admin').emit('new-delivery-request', {
          orderId,
          restaurantId,
          restaurant: order.restaurantId,
          customer: order.customerId,
          deliveryAddress: order.deliveryAddress,
          priority: order.priority || 'normal',
          timestamp: new Date()
        });

        // Send push notifications to restaurant staff
        const restaurantUsers = await User.find({
          shopId: restaurantId,
          role: 'shop-admin',
          fcmToken: { $exists: true, $ne: null }
        });

        for (const user of restaurantUsers) {
          await sendPushNotification(
            user.fcmToken,
            {
              title: 'New Order!',
              body: `Order from ${order.customerId.name}`,
              icon: '/icon192.png'
            },
            {
              orderId: orderId,
              type: 'new_order'
            }
          );
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle staff status updates
    socket.on('update-staff-status', async (data) => {
      try {
        if (socket.userRole !== 'deli-staff') {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { status, location } = data;
        
        // Update user status in Redis
        await setUserStatus(socket.userId, status);

        // Update connected users map
        if (connectedUsers.has(socket.userId)) {
          connectedUsers.get(socket.userId).status = status;
        }

        const statusData = {
          staffId: socket.userId,
          staffName: socket.user.name,
          status,
          location,
          timestamp: new Date()
        };

        // Broadcast to admins
        io.to('role:deli-admin').to('role:super-admin').emit('staff-status-updated', statusData);

        // Broadcast to other staff
        socket.to('delivery-staff').emit('colleague-status-updated', statusData);

        socket.emit('status-update-confirmed', { status, timestamp: statusData.timestamp });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Enhanced chat system
    socket.on('send-message', async (data) => {
      try {
        const { orderId, message, type = 'text', attachments = [] } = data;
        
        const order = await Order.findById(orderId)
          .populate('customerId', 'name')
          .populate('assignedStaffId', 'name');

        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        const canChat = 
          (socket.userRole === 'customer' && order.customerId._id.toString() === socket.userId) ||
          (socket.userRole === 'deli-staff' && order.assignedStaffId?._id.toString() === socket.userId) ||
          socket.userRole === 'deli-admin' ||
          socket.userRole === 'super-admin';

        if (!canChat) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const chatMessage = {
          id: Date.now().toString(),
          orderId,
          senderId: socket.userId,
          senderName: socket.user.name,
          senderRole: socket.userRole,
          message,
          type,
          attachments,
          timestamp: new Date(),
          read: false
        };

        // Store message in order
        if (!order.chatMessages) order.chatMessages = [];
        order.chatMessages.push(chatMessage);
        await order.save();

        // Broadcast to order participants
        io.to(`order:${orderId}`).emit('chat-message', chatMessage);

        // Send push notification to other party
        const otherPartyId = socket.userRole === 'customer' 
          ? order.assignedStaffId?._id 
          : order.customerId._id;

        if (otherPartyId) {
          const otherUser = await User.findById(otherPartyId);
          if (otherUser?.fcmToken) {
            await sendPushNotification(
              otherUser.fcmToken,
              {
                title: `Message from ${socket.user.name}`,
                body: type === 'text' ? message : `Sent a ${type}`,
                icon: '/icon192.png'
              },
              {
                orderId: orderId,
                type: 'chat_message'
              }
            );
          }
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle message read status
    socket.on('mark-messages-read', async (data) => {
      try {
        const { orderId, messageIds } = data;
        
        const order = await Order.findById(orderId);
        if (!order) {
          return socket.emit('error', { message: 'Order not found' });
        }

        // Mark messages as read
        order.chatMessages.forEach(msg => {
          if (messageIds.includes(msg.id) && msg.senderId !== socket.userId) {
            msg.read = true;
          }
        });

        await order.save();

        // Broadcast read status
        io.to(`order:${orderId}`).emit('messages-read', {
          orderId,
          messageIds,
          readBy: socket.userId
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle emergency alerts
    socket.on('emergency-alert', async (data) => {
      try {
        if (socket.userRole !== 'deli-staff') {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { type, message, location, orderId } = data;
        
        const alertData = {
          id: Date.now().toString(),
          staffId: socket.userId,
          staffName: socket.user.name,
          type,
          message,
          location,
          orderId,
          timestamp: new Date()
        };

        // Broadcast to all admins and nearby staff
        io.to('role:deli-admin').to('role:super-admin').emit('emergency-alert', alertData);

        // Send push notifications to admins
        const adminUsers = await User.find({
          role: { $in: ['deli-admin', 'super-admin'] },
          fcmToken: { $exists: true, $ne: null }
        });

        for (const admin of adminUsers) {
          await sendPushNotification(
            admin.fcmToken,
            {
              title: '🚨 Emergency Alert',
              body: `${socket.user.name}: ${message}`,
              icon: '/icon192.png'
            },
            {
              type: 'emergency',
              staffId: socket.userId,
              alertId: alertData.id
            }
          );
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle bulk notifications
    socket.on('send-bulk-notification', async (data) => {
      try {
        if (!['super-admin', 'deli-admin'].includes(socket.userRole)) {
          return socket.emit('error', { message: 'Permission denied' });
        }

        const { title, message, targetRoles, targetUsers } = data;
        
        const notification = {
          id: Date.now().toString(),
          title,
          message,
          senderId: socket.userId,
          senderName: socket.user.name,
          timestamp: new Date()
        };

        // Send to specific roles
        if (targetRoles?.length) {
          targetRoles.forEach(role => {
            io.to(`role:${role}`).emit('bulk-notification', notification);
          });
        }

        // Send to specific users
        if (targetUsers?.length) {
          targetUsers.forEach(userId => {
            io.to(`user:${userId}`).emit('bulk-notification', notification);
          });
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle analytics events
    socket.on('analytics-event', async (data) => {
      try {
        const { event, properties } = data;
        
        const analyticsData = {
          userId: socket.userId,
          userRole: socket.userRole,
          event,
          properties,
          timestamp: new Date()
        };

        // Broadcast to analytics collectors (admins)
        io.to('role:super-admin').emit('analytics-event', analyticsData);

      } catch (error) {
        console.error('Analytics event error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { orderId } = data;
      socket.to(`order:${orderId}`).emit('user-typing', {
        orderId,
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing-stop', (data) => {
      const { orderId } = data;
      socket.to(`order:${orderId}`).emit('user-stopped-typing', {
        orderId,
        userId: socket.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);

      // Update user status
      await setUserStatus(socket.userId, 'offline');
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      userSockets.delete(socket.id);

      // Broadcast user offline status
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });
  });

  // Helper function to send pending notifications
  async function sendPendingNotifications(socket) {
    try {
      const notifications = await Notification.find({
        userId: socket.userId,
        read: false
      }).sort({ createdAt: -1 }).limit(10);

      if (notifications.length > 0) {
        socket.emit('pending-notifications', notifications);
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  // Cleanup interval for inactive connections
  setInterval(() => {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    connectedUsers.forEach((userData, userId) => {
      if (now - userData.lastSeen > timeout) {
        const socket = io.sockets.sockets.get(userData.socketId);
        if (socket) {
          socket.disconnect(true);
        }
        connectedUsers.delete(userId);
      }
    });
  }, 60000); // Check every minute

  return io;
};

module.exports = socketHandler;
