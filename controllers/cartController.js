const Cart = require('../models/Cart');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');
class CartController {
  static async getCart(req, res) {
    try {
      let cart = await Cart.findOne({ customerId: req.user.id, isActive: true })
        .populate('restaurantId', 'name image deliveryFee minimumOrder');

      if (!cart) {
        cart = new Cart({ customerId: req.user.id, items: [] });
        await cart.save();
      }

      res.json(cart);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }



static async getAllCartByUserId(req, res) {
  try {
    const userId = req.params.userId;
    console.log(userId, "userId from params");
    // Check if userId exists and is a valid MongoDB ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid or missing userId' });
    }

    const carts = await Cart.find({ customerId: userId, isActive: true });

    if (!carts || carts.length === 0) {
      return res.status(404).json({ message: 'No active carts found for this user' });
    }

    const populatedCarts = await Cart.populate(carts, {
      path: 'items.restaurantId',
      select: 'name image deliveryFee',
    });

    res.json(populatedCarts);

  } catch (error) {
    console.error('Get all carts by user ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
   

  // static async addItem(req, res) {
  //   try {
  //     const {items,promoCode, deliveryAddress, deliveryType } = req.body;
  //     const customerId = req.user.id;

  //     let cart = await Cart.findById(customerId);

  //     if (!cart) {
  //       cart = new Cart({
  //         customerId,
  //         items: [],
  //         promoCode,
  //         deliveryAddress,
  //         deliveryType,
  //         isActive: true,
  //         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  //       });
  //     } else {
  //       // cart.restaurantId = restaurantId;
  //       cart.items = [];
  //       cart.promoCode = promoCode;
  //       cart.deliveryAddress = deliveryAddress;
  //       cart.deliveryType = deliveryType;
  //       cart.isActive = true;
  //       cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  //     }

  //     for (const item of items) {
  //       const {
  //         restaurantId,
  //         menuItemId,
  //         name,
  //         price,
  //         quantity,
  //         image,
  //         variant,
  //         specialInstructions
  //       } = item;

  //       if (!menuItemId || !name || isNaN(price) || isNaN(quantity)) {
  //         return res.status(400).json({ message: 'Invalid item data', item });
  //       }

  //       const totalPrice = price * quantity;

  //       cart.items.push({
  //         ...item,
  //         restaurantId,
  //         totalPrice
  //       });
  //     }

  //     await cart.save();

  //     const populatedCart = await Cart.findById(cart._id)
  //       .populate('items.restaurantId', 'name image deliveryFee minimumOrder');

  //     res.json(populatedCart);
  //   } catch (error) {
  //     console.error('Add cart item error:', error);
  //     res.status(500).json({ message: 'Server error', error: error.message });
  //   }
  // }

  static async addItem(req, res) {
  try {
    const { items, promoCode, deliveryAddress, deliveryType } = req.body;
    const customerId = req.user.id;

    // Find existing active cart
    let cart = await Cart.findOne({ customerId, isActive: true });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        customerId,
        items: [],
        promoCode,
        deliveryAddress,
        deliveryType,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hrs from now
      });
    } else {
      // Keep existing items, update metadata
      cart.promoCode = promoCode;
      cart.deliveryAddress = deliveryAddress;
      cart.deliveryType = deliveryType;
      cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    for (const item of items) {
      const {
        restaurantId,
        menuItemId,
        name,
        price,
        quantity,
        image,
        variant,
        specialInstructions
      } = item;

      if (!menuItemId || !name || isNaN(price) || isNaN(quantity)) {
        return res.status(400).json({ message: 'Invalid item data', item });
      }

      const existingItemIndex = cart.items.findIndex(
        i => i.menuItemId.toString() === menuItemId
      );

      const totalPrice = price * quantity;

      if (existingItemIndex > -1) {
        // Update existing item (add quantity)
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].totalPrice =
          cart.items[existingItemIndex].quantity * price;
      } else {
        // Add new item
        cart.items.push({
          restaurantId,
          menuItemId,
          name,
          price,
          quantity,
          image,
          variant,
          specialInstructions,
          totalPrice
        });
      }
    }

    cart.updatedAt = new Date();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.restaurantId', 'name image deliveryFee minimumOrder');

    res.json(populatedCart);
  } catch (error) {
    console.error('Add cart item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


 static async updateItem(req, res) {
  try {
    const { quantity, specialInstructions } = req.body;
    console.log(req.params.itemId, "itemId from params");

    const cart = await Cart.findOne({ customerId: req.user.id, isActive: true });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.menuItemId.toString() === req.params.itemId);

    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.menuItemId.toString() !== req.params.itemId); // remove item
    } else {
      item.quantity = quantity;
      item.specialInstructions = specialInstructions || item.specialInstructions;
      const customizationPrice =
        item.customizations?.reduce((sum, c) => sum + (c.price || 0), 0) || 0;
      item.totalPrice = (item.price + customizationPrice) * quantity;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.restaurantId',
      'name image deliveryFee minimumOrder'
    );

    res.json(populatedCart);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


  // static async removeItem(req, res) {
  //   console.log('requested data => ',req)
  //   try {
  //     const cart = await Cart.findOne({ customerId: req.user.id, isActive: true });

  //     if (!cart) return res.status(404).json({ message: 'Cart not found' });

  //     cart.items.pull(req.params.itemId);
  //     await cart.save();

  //     const populatedCart = await Cart.findById(cart._id)
  //       .populate('restaurantId', 'name image deliveryFee minimumOrder');

  //     res.json(populatedCart);
  //   } catch (error) {
  //     console.error('Remove cart item error:', error);
  //     res.status(500).json({ message: 'Server error', error: error.message });
  //   }
  // }

  static async removeItem(req,res){
    try {
      console.log(req.params,"Requested data <<<<<");
      const customerId= req.params.customerId;
      const cart= await Cart.findOne({ customerId, isActive: true });
      console.log(cart,"This is Cart <<<<")
      if(!cart){
        return res.status(400).json({message : 'Cart not found'});
      }
      const itemIdex = cart.items.findIndex(
        item=>item.menuItemId.toString() === req.params.itemId
      );

      console.log(itemIdex,"<<item to be deleted")

      if(itemIdex === -1){
        return res.status(404).json({message : 'Cart Items not found'});
      }

      //Get the Cart Item to delete
      const CartItemToDelete = cart.items[itemIdex];

      cart.items.splice(itemIdex,1);
      await cart.save();
      res.json("Cart Item is successfully deleted !!!");
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
      
    }
  }

  // DELETE /api/carts/:customerId
static async clearCart(req, res) {
  try {
    const { customerId } = req.params;

    const result = await Cart.deleteOne({ customerId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No cart found for this customer.' });
    }

    res.json({
      message: `Deleted ${result.deletedCount} cart(s) for customerId: ${customerId}`,
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


  static async applyPromoCode(req, res) {
    try {
      const { promoCode } = req.body;

      const cart = await Cart.findOne({ customerId: req.user.id, isActive: true });

      if (!cart) return res.status(404).json({ message: 'Cart not found' });

      // Placeholder promo logic
      cart.promoCode = promoCode;
      cart.totals = cart.totals || {};
      cart.totals.discount = (cart.totals.subtotal || 0) * 0.1; // example: 10% discount

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate('restaurantId', 'name image deliveryFee minimumOrder');

      res.json(populatedCart);
    } catch (error) {
      console.error('Apply promo code error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = CartController;
