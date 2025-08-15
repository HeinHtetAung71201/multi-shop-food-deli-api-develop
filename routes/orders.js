const express = require('express');
const { auth } = require('../middleware/auth');
const { query } = require('express-validator');
const mongoose = require('mongoose');
const OrderController = require('../controllers/orderController');

const router = express.Router();

// Get orders for user
router.get('/users/:customerId', auth, OrderController.getAllOrders);

router.get('/orders/total-revenue', auth, OrderController.getTotalOrderRevenue);

router.get('/', auth, OrderController.getAllOrders);

// Create order
router.post('/', auth, OrderController.createOrder);

//Create order from Cart
router.post('/cartOrder',auth, OrderController.createOrderFromCart);

//Create order createOrderFromCart 
// router.post('/cart/:customerId', auth, OrderController.createOrderFromCart);

//getByDeliComapanyId
router.get('/deli/:deliveryCompanyId',auth,OrderController.getOrderByDeliveryCompanyId);

// Update order status
router.put('/status/:id', auth, OrderController.updateOrderStatus);

//update order for assigned staff
router.put('/assignedStaff/:id', auth, OrderController.updateOrderAssignedStaff);


router.put('/assignedDeliCompany/:id', auth, OrderController.updateOrderAssignedDeliCompany);

router.put('/deliveredStaff/:id', auth , OrderController.updateStaffOrderStatus)


// Get orders by stuff ID
router.get('/staff/:staffId', auth, OrderController.getOrdersByStaffId);//Orde.fing({assignedStaffId: req.params.staffId});


// Get order by ID
router.get('/:id', auth, OrderController.getOrderById);

router.get('/restaurant/:restaurantId', auth, [
    //param('restaurantId').isMongoId().withMessage('Invalid restaurant ID'),
    query('status')
      .optional()
      .isIn([
      'pending',
      'accepted',
      'preparing',
      'ready',
      'assigned',
      'picked-up',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'refunded',
      'completed',
      'all'
      ])
      .withMessage('Invalid status'),
  ], OrderController.getOrderByRestId);

module.exports = router;