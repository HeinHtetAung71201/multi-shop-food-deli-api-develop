const Shop = require("../models/Shop");

class ShopController{
    

// Create a new shop
static async createShop(req, res) {
    try {
        console.log(req.body)
      const shopData = req.body;
      const shop = new Shop(shopData);
      await shop.save();
      
      res.status(201).json(shop);
      //res.status(201).send(category);
    } catch (error) {
      console.error('Create shop error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'shop name already exists' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }

// Get all shopsq
static async getAllShops(req,res) {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a shop by ID
static async getShopById(req, res)  {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a shop by ID
static async updateShop(req, res) {
  try {
    const updatedShop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedShop) return res.status(404).json({ message: 'Shop not found' });
    res.json(updatedShop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a shop by ID
static async deleteShop(req,res) {
  try {
    const deletedShop = await Shop.findByIdAndDelete(req.params.id);
    if (!deletedShop) return res.status(404).json({ message: 'Shop not found' });
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

}
module.exports= ShopController