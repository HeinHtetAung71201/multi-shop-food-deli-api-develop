
const Order = require('../models/Order');

class DeliveryController {
  static async getDeliveryAssignments(req, res) {
    try {
      if (req.user.role !== 'deli-staff') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const orders = await Order.find({ 
        deliveryPersonId: req.user.id,
        status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
      }).populate('restaurantId', 'name address');
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateDeliveryStatus(req, res) {
    try {
      const { status, location } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.orderId,
        { 
          status,
          ...(location && { deliveryLocation: location })
        },
        { new: true }
      );
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getDeliveryStats(req, res) {
    try {
      if (req.user.role !== 'deli-staff' && req.user.role !== 'deli-admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const stats = await Order.aggregate([
        {
          $match: req.user.role === 'deli-staff' 
            ? { deliveryPersonId: req.user.id }
            : {}
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = DeliveryController;
