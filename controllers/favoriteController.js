const mongoose = require('mongoose'); 
const Favorite = require('../models/Favorite');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');

class FavoriteController {

static async getFavoritesByUser(req, res) {
  const customerId = req.user.id;
  console.log(customerId, "<<<<<<< Customer Id");
  try {
    const favorites = await Favorite.find({ customerId }).sort({ createdAt: -1 });

    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav) => {
        const restaurant = await Restaurant.findById(fav.restaurantId).populate('category', 'name');
          // .select(
          //   'name publicImgUrl rating address category description openTime closeTime menu'
          // )
          
          

        if (!restaurant) {
          return {
            ...fav.toObject(),
            restaurant: null,
            menuItem: null
          };
        }

        const menuItem = restaurant.menu.id(fav.menuItemId);
        let menuItemWithCategory = null;

        if (menuItem) {
          let categoryInfo = null;

          if (menuItem.category && mongoose.Types.ObjectId.isValid(menuItem.category)) {
            try {
              categoryInfo = await Category.findById(menuItem.category).select('name');
            } catch (err) {
              console.warn(`Category fetch failed: ${err.message}`);
            }
          } else {
            console.warn(`Invalid or missing category ID: ${menuItem.category}`);
          }

          menuItemWithCategory = {
            ...menuItem.toObject(),
            category: categoryInfo ? categoryInfo.toObject() : null
          };
        }

        return {
          restaurant: {
            _id: restaurant._id,
            name: restaurant.name,
            publicImgUrl: restaurant.publicImgUrl,
            rating: restaurant.rating,
            category: restaurant.category, // populated name
            description: restaurant.description,
            deliveryFee: restaurant.deliveryFee,
            address: restaurant.address,
            openTime: restaurant.openTime,
            closeTime: restaurant.closeTime
          },
          menuItem: menuItemWithCategory
        };
      })
    );

    res.json({ success: true, data: favoritesWithDetails });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

static async getFavorite(req , res){
  const customerId = req.user.id;
  console.log(customerId, "<<<<<<< Customer Id");
  try{
    const favorite = await Favorite.find({customerId: req.user.id})
    .populate('restaurantId','name')
    .populate('menuItemId','name');
   
      console.log("Get Successfully");
      res.json(favorite);
    
  
  }
  catch(error){
   console.log("Failed Get");
   res.status(500).json({error : error.message});
   
  }
  
}

static async addFavoriteToFood(req, res) {
  try {
    const { menuItemId } = req.body;
    console.log(req.body,"This is requested body<<<" );
        // Validate restaurant
    // const restaurant = await Restaurant.findById(restaurantId);
    // if (!restaurant) {
    //   return res.status(404).json({ message: 'Restaurant not found' });
    // }
    // Check for existing favorite (customerId + menuItemId)
    const existingFavorite = await Favorite.findOne({
      customerId: req.user.id,
      menuItemId
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Menu item already in favorites' });
    }

    // Create and save new favorite
    const favorite = new Favorite({
      customerId: req.user.id,
      menuItemId,
      //restaurantId,
    });

    await favorite.save();

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Add favorite error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Menu item already in favorites Error',
        error: error.message,
      });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

static async addFavoriteToRestaurant(req, res) {
  try {
    const { restaurantId } = req.body;
    console.log(req.body,"This is requested body<<<" );
        // Validate restaurant
    // const restaurant = await Restaurant.findById(restaurantId);
    // if (!restaurant) {
    //   return res.status(404).json({ message: 'Restaurant not found' });
    // }
    // Check for existing favorite (customerId + menuItemId)
    const existingFavorite = await Favorite.findOne({
      customerId: req.user.id,
      restaurantId
    });
     
    if (existingFavorite) {
      return res.status(400).json({ message: 'Menu item already in favorites' });
    }
     
    await Favorite.syncIndexes();

    // Create and save new favorite
    const favorite = new Favorite({
      customerId: req.user.id,
      restaurantId,
    });

    await favorite.save();

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Add favorite error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Menu item already in favorites Error',
        error: error.message,
      });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

  static async removeFavorite(req, res) {
    try {
      // const favorite = await Favorite.findOneAndDelete({
      //   // customerId: req.user.id,
      //   // restaurantId: req.params.restaurantId

      // });
      const favorite=await Favorite.findOneAndDelete({customerId: req.user.id,
        menuItemId: req.params.menuItemId});
      
      if (!favorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.json({ favorite });
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  //removeFavoriteRes
  static async removeFavoriteRes(req, res) {
    try {
      // const favorite = await Favorite.findOneAndDelete({
      //   // customerId: req.user.id,
      //   // restaurantId: req.params.restaurantId

      // });
      const favorite=await Favorite.findOneAndDelete({customerId: req.user.id ,
        restaurantId: req.params.restaurantId });
      
      if (!favorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.json(favorite);
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateFavorite(req, res) {
    try {
      const { notes } = req.body;
      
      const favorite = await Favorite.findOneAndUpdate(
        {
          customerId: req.user.id,
          restaurantId: req.params.restaurantId
        },
        { notes },
        { new: true }
      ).populate('restaurantId');
      
      if (!favorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.json(favorite);
    } catch (error) {
      console.error('Update favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async checkFavorite(req, res) {
    try {
      const favorite = await Favorite.findOne({
        customerId: req.user.id,
        restaurantId: req.params.restaurantId
      });
      
      res.json({ isFavorite: !!favorite });
    } catch (error) {
      console.error('Check favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = FavoriteController;
