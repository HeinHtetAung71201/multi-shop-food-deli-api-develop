const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryCompany = require('../models/DeliveryCompany');
const { default: mongoose } = require('mongoose');
// const { default: mongoose } = require('mongoose');

class AdminController {

  static async getDashboardStats(req, res) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    try {
        const requestedParams= req.params;
        console.log(requestedParams,"This is req params");
        const deliCompanyId= req.params.deliCompanyId;
        const restaurantId= req.params.restaurantId;
        console.log(deliCompanyId,"This is deliCompanyId<<");
        console.log(restaurantId,"This is restauratn<<");

        if(deliCompanyId){
          console.log("deliCompanyId>>>>",deliCompanyId);
          const totalOrders = await Order.countDocuments({deliveryCompanyId: deliCompanyId});
          const activeStaff = await User.countDocuments({
            role:'deli-staff',
            isActive: true,
            deliCompanyId: deliCompanyId
          });
          const pendingOrders= await Order.countDocuments({ status: 'assigned', deliveryCompanyId: deliCompanyId });
          const acceptedOrders= await Order.countDocuments({status: 'accepted', deliveryCompanyId: deliCompanyId });
          const deliveredOrders= await Order.countDocuments({status:'delivered', deliveryCompanyId: deliCompanyId });
            const assignedOrders = await Order.countDocuments({
              assignedStaffId: { $exists: true, $ne: null },
              deliveryCompanyId: deliCompanyId 
            });
            const pendingTodayOrders=await Order.countDocuments({
              status: 'assigned', 
              createdAt: { $gte: startOfToday, $lt: endOfToday } ,
              deliveryCompanyId: deliCompanyId 
            });
            const acceptedTodayOrders= await Order.countDocuments({
              status: 'accepted', 
              createdAt: { $gte: startOfToday, $lt: endOfToday },
              deliveryCompanyId: deliCompanyId 
            });
            const deliveredTodayOrders= await Order.countDocuments({
                status: 'delivered', 
                  createdAt: { $gte: startOfToday, $lt: endOfToday },
                  deliveryCompanyId: deliCompanyId 
            })
            const todayTotalOrder= await Order.countDocuments({
                  createdAt: { $gte: startOfToday, $lt: endOfToday },
                  deliveryCompanyId: deliCompanyId 
            })
            const progressOrders= await Order.countDocuments({ status: 'picked-up', deliveryCompanyId: new mongoose.Types.ObjectId(deliCompanyId) });

            // const totalRevenue = Order.aggregate([
            //   { $match: { status: 'delivered', 'deliveryCompanyId': deliCompanyId } },
            //   { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
            // ]);

            const totalRevenue = await Order.aggregate([
              { $match: { status: 'delivered',deliveryCompanyId: new mongoose.Types.ObjectId(deliCompanyId) } },
              { $group: { _id: null, total: { $sum: '$pricing.deliveryFee' } } },
            ]);
             res.json({
              activeStaff,
              // totalUsers,
              todayTotalOrder,
              progressOrders,
              totalOrders,
              pendingOrders,
              acceptedOrders,
              deliveredOrders,
              assignedOrders,
              pendingTodayOrders,
              acceptedTodayOrders,
              deliveredTodayOrders,
              // totalRestaurants,
              // totalDeliCompaines,
              totalRevenue: totalRevenue[0]?.total || 0
            });
              }
          else if(restaurantId){
            console.log("This is for restaurants ");
            const totalOrders = await Order.countDocuments({restaurantId: restaurantId});
            const pendingOrders= await Order.countDocuments({ status: 'pending', restaurantId: restaurantId });
            const acceptedOrders= await Order.countDocuments({status: 'accepted', restaurantId: restaurantId });
            const deliveredOrders= await Order.countDocuments({status:'delivered', restaurantId: restaurantId });
            const assignedOrders = await Order.countDocuments({
              assignedStaffId: { $exists: true, $ne: null },
              restaurantId: restaurantId 
            });
            const pendingTodayOrders=await Order.countDocuments({
              status: 'pending', 
              createdAt: { $gte: startOfToday, $lt: endOfToday } ,
              restaurantId: restaurantId 
            });
            const acceptedTodayOrders= await Order.countDocuments({
              status: 'accepted', 
              createdAt: { $gte: startOfToday, $lt: endOfToday },
              restaurantId: restaurantId 
            });
            const deliveredTodayOrders= await Order.countDocuments({
              status: 'delivered', 
              createdAt: { $gte: startOfToday, $lt: endOfToday },
              deliveryCompanyId: deliCompanyId 
            })
            const totalRevenue = await Order.aggregate([
              { $match: { status: 'delivered',restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
              { $group: { _id: null, total: { $sum: '$pricing.subtotal' } } },
            ]);
            res.json({
        // activeStaff,
        // totalUsers,
        totalOrders,
        pendingOrders,
        acceptedOrders,
        deliveredOrders,
        assignedOrders,
        pendingTodayOrders,
        acceptedTodayOrders,
        deliveredTodayOrders,
        // totalRestaurants,
        // totalDeliCompaines,
        totalRevenue: totalRevenue[0]?.total || 0
      });
          }
            else{
              const totalOrders = await Order.countDocuments();
              const totalUsers = await User.countDocuments();
              const totalRestaurants = await Restaurant.countDocuments();
              const totalDeliCompaines= await DeliveryCompany.countDocuments();
               const totalRevenue = await Order.aggregate([
              { $match: { status: 'delivered'} },
              { $group: { _id: null, total: { $sum: '$pricing.total' } } },
            ]);
               res.json({
                // activeStaff,
                totalUsers,
                totalOrders,
                // pendingOrders,
                // acceptedOrders,
                // deliveredOrders,
                // assignedOrders,
                // pendingTodayOrders,
                // acceptedTodayOrders,
                // deliveredTodayOrders,
                totalRestaurants,
                totalDeliCompaines,
                totalRevenue: totalRevenue[0]?.total || 0
              });
            } 


      // const activeStaff = await User.countDocuments({
      //   role:'deli-staff',
      //   isActive: true,
      //   deliCompanyId: deliCompanyId
      // });
      // const totalUsers = await User.countDocuments();
      // const totalOrders = await Order.countDocuments({deliveryCompanyId: deliCompanyId});
      // const acceptedOrders= await Order.countDocuments({status: 'accepted', deliveryCompanyId: deliCompanyId });
      // const deliveredOrders= await Order.countDocuments({status:'delivered', deliveryCompanyId: deliCompanyId });
      // const assignedOrders = await Order.countDocuments({
      //   assignedStaffId: { $exists: true, $ne: null },
      //    deliveryCompanyId: deliCompanyId 
      // });

      //Today Orders
      // const pendingTodayOrders=await Order.countDocuments({
      //    status: 'pending', 
      //   createdAt: { $gte: startOfToday, $lt: endOfToday } ,
      //    deliveryCompanyId: deliCompanyId 
      // });
      // const acceptedTodayOrders= await Order.countDocuments({
      //    status: 'accepted', 
      //   createdAt: { $gte: startOfToday, $lt: endOfToday },
      //    deliveryCompanyId: deliCompanyId 
      // });
      // const deliveredTodayOrders= await Order.countDocuments({
      //    status: 'delivered', 
      //     createdAt: { $gte: startOfToday, $lt: endOfToday },
      //      deliveryCompanyId: deliCompanyId 
      // })
      // const totalRestaurants = await Restaurant.countDocuments();
      // const totalDeliCompaines= await DeliveryCompany.countDocuments();
      // const totalRevenue = await Order.aggregate([
      //   { $match: { status: 'delivered',deliveryCompanyId: deliCompanyId } },
      //   { $group: { _id: null, total: { $sum: '$total' } } },
      // ]);
      
      
    } catch (error) {
      res.status(500).json({ message: 'Server error',error: error.message });
    }
  }

  static async getAllUsers(req, res) {
    try {
      if (req.user.role !== 'super-admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateUserRole(req, res) {
    try {
      if (req.user.role !== 'super-admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select('-password');
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AdminController;
