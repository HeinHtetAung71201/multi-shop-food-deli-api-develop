const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Restaurant = require('../models/Restaurant');
const RecentActivities = require('../models/RecentActivities');
const mongoose = require('mongoose');
class OrderController {
  static async getAllOrders(req, res) {
    try {
      console.log(req.params.customerId,"requested User data<<<");
      let orders;
      if (req.user.role === 'customer') {
        orders = await Order.find({ customerId: req.user.id })
          .populate('restaurantId', 'name')
          .sort({ createdAt: -1 });
      } else {
        orders = await Order.find()
          .populate('customerId', 'name email')
          .populate('restaurantId', 'name')
          //.populate('deliveryService','name fee')
          .sort({ createdAt: -1 });
      }
      res.json(orders);
      console.log(orders, "<<<< all orders");

    } catch (error) {
      res.status(500).json({ message: 'Server error' , error: error.message });
    }
  }

   static async getTotalOrderRevenue  (req, res)  {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const total = result[0]?.totalRevenue || 0;

    res.status(200).json({ totalOrderRevenue: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate total order price', details: err });
  }
};

  static async createOrder(req, res) {
    try {
      const orderData = {
        ...req.body,
        customerId: req.user.id,
        //status: 'assigned'
      };

      const order = new Order(orderData);
      await order.save();
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

// static async createOrderFromCart(req, res) {
//   console.log(req.body, "This is requested body <<<<<");

//   try {
//     const ordersData = req.body;
//     console.log(ordersData,"Data from req bodly");

//     if (!Array.isArray(ordersData)) {
//       return res.status(400).json({ message: 'Request body must be an array of orders' });
//     }

//     const createdOrders = [];

//     for (const orderInput of ordersData) {
//       const {
//         customerPhone,
//         customerAddress,
//         customerId,
//         restaurantId,
//         items,
//         pricing,
//         deliverType,
//         paymentMethod,
//       } = orderInput;

//       // Validate deliveryAddress type
//       if (typeof customerAddress !== 'string') {
//         return res.status(400).json({
//           message: 'Invalid customerAddress format: must be a string',
//           customerAddress,
//         });
//       }

//       const orderData = {
//         customerPhone,
//         customerAddress: customerAddress.trim(), // optional cleanup
//         customerId,
//         restaurantId,
//         items,
//         pricing,
//         deliverType,
//         paymentMethod,
//         status: 'pending'
//       };

//       const order = new Order(orderData);
//       await order.save();
//       await RecentActivities.create({
//             action: "Changed Password",
//             userId: req.body.customerId,
//             target: user._id
//           })
//       createdOrders.push(order);
//     }

//     res.status(201).json({ message: 'Orders created', orders: createdOrders });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// }





  static async createOrderFromCart (req,res){
     try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ customerId: userId, isActive: true });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    const groupedItems = {};
    for (const item of cart.items) {
      const restId = item.restaurantId.toString();
      if (!groupedItems[restId]) groupedItems[restId] = [];
      groupedItems[restId].push(item);
    }

    const orders = [];

    for (const [restaurantId, items] of Object.entries(groupedItems)) {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = 1000; // can be calculated or pulled from config
      const total = subtotal + deliveryFee;

      const orderItems = items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant || '',
        notes: item.specialInstructions || '',
        customizations: item.customizations || []
      }));

      const order = new Order({
        customerId: userId,
        restaurantId,
        items: orderItems,
        pricing: {
          subtotal,
          deliveryFee,
          total
        },
        deliveryCompanyId: cart.deliveryCompanyId, // or assign dynamically
        deliverType: cart.deliveryType,
        deliveryAddress: cart.deliveryAddress || {},
        customerInfo: cart.customerInfo,
        paymentMethod: {
          type: cart.paymentMethod || 'cash',
          isPaid: false
        },
        status: 'pending'
      });

      await order.save();
      orders.push(order);
       await RecentActivities.create({
            action: "New Order Created",
            userId: req.user.id, // actor
            // target: user._id       // updated profile
          });
    }

    // Optionally, clear the cart
    cart.items = [];
    cart.isActive = false;
    await cart.save();

    res.status(201).json({ message: 'Orders created', orders });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

static async updateOrderAssignedStaff(req, res) {
  try {
    const { assignedStaffId } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { assignedStaffId ,
        'status':'picked-up'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// updateOrderAssignedDeliCompany
static async updateOrderAssignedDeliCompany(req, res) {
  try {
    const { deliveryCompanyId, status } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    // Build update object dynamically
    const updateFields = {};
    if (deliveryCompanyId) updateFields.deliveryCompanyId = deliveryCompanyId;
    if (status) updateFields.status = status;

    const order = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}




  static async getOrderById(req, res) {
    try {
      const order = await Order.findById(req.params.id)
        .populate('customerId', 'name email phone')
        .populate('restaurantId', 'name address')
        .populate('deliCompanyId','name fee');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }


  static async getOrderByRestId(req, res) {
  try {
    //console.log(req, "<< requested params");

    // const status = req.query.status; // e.g., "active"
    // console.log(status, "<< status");

    // const query ={};

    // if (status) {
    //   query = status;
    // }

    // const orders = await Order.find({ restaurantId: req.params.restaurantId,query })
    //   .populate('customerId', 'name email');

    const { status } = req.query;
    const { restaurantId } = req.params;

    const query = { restaurantId };
    console.log(status, "<< status");

    if (status && status.toLowerCase() !== 'all') {
      query.status = status;
    }
    console.log(query, "<< query for restaurant orders");
    const orders = await Order.find(query)
       .populate('customerId', 'name email')
       .populate('restaurantId', 'menu name address');

    if (!orders || orders.length === 0) {

      return res.status(404).json({ success: false, message: 'No orders found for this restaurant',
        error: error.message
       });
    }

    console.log("Get Orders by Restaurant ID <<", orders.length);

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders by restaurant ID:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
    }

 static async getOrderByDeliveryCompanyId(req, res) {

  try {
    console.log(req.params, "<< requested params");

    const { deliveryCompanyId } = req.params;

    console.log(deliveryCompanyId, "<< Id deliveryCompany");

    const orders = await Order.find({ deliveryCompanyId })
          .populate('restaurantId', 'name address')
          .populate('customerId','name address phone');

    console.log(orders, "<<<< orders");

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "No orders found for this delivery company"
      });
    }

    res.json({
      success: true,
      //count: orders.length,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}

static async getOrdersByStaffId(req, res) {
  try {
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid Staff ID" });
    }

    const orders = await Order.find({ assignedStaffId: staffId })
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name address')
      .populate('deliveryCompanyId', 'name fee');

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this staff' });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  } 
}

static async updateStaffOrderStatus(req, res) {
  try {
    const assignedStaffId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { assignedStaffId ,
        'status':'delivered'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}



}
module.exports = OrderController;