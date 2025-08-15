
const { uploadFileFirebaseService, createPublicUrlService, deleteFile } = require('../config/firebase');
const Restaurant = require('../models/Restaurant');
const config = require('../config/config');
const RestaurantController = require('./restaurantController');
const fs = require('fs');
class MenuController {
static async getMenuByRestaurant(req, res) {
    try {
      const restaurant = await Restaurant.findById(req.params.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.json(restaurant.menu);
    } catch (error) {
      res.status(500).json({ message: 'Server error confrim',error:error.message });
    }
  }

static async getAllMenuItems(req, res) {
  try {
    console.log(req.query, "requested data");
    const { category } = req.query;

    // Populate restaurant name
    const restaurants = await Restaurant.find().sort({ rating: -1 }).select('name menu');

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({ message: 'No menu items found' });
    }

    // Flatten and attach restaurant name to each menu item
    let allMenuItems = restaurants.flatMap(restaurant =>
      restaurant.menu.map(item => ({
        ...item.toObject(),
        restaurantName: restaurant.name,
        restaurantId: restaurant._id
      }))
    );

    if (category) {
      allMenuItems = allMenuItems.filter(item => item.category === category);
    }

    res.json(allMenuItems);
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

static async deleteMenuItem(req, res) {
  try {
    console.log(req.body, "requested data <<<<<<");

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find the index of the menu item
    const menuIndex = restaurant.menu.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (menuIndex === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Get the menu item to delete
    const menuItemToDelete = restaurant.menu[menuIndex];

    // Safely delete file if storagePath exists
    if (menuItemToDelete && menuItemToDelete.storagePath) {
      await deleteFile(menuItemToDelete.storagePath);
      console.log(`Deleted file: ${menuItemToDelete.storagePath}`);
    } else {
      console.log('No file to delete or storagePath missing');
    }

    // Remove the menu item from the array
    restaurant.menu.splice(menuIndex, 1);
    await restaurant.save();

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMenuItem:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
static async addMenuItem(req, res) {
    console.log(req.body,"requested body<<<<");
    const file= req.file;
    if(!file){
      return res.status(400).json({
        success:false,
        message:"No Menu Photo",
        error:"upload menu photo",
      })
    }

    const {path: filePath}= file;
    console.log(file);
    try {
      const restaurant = await Restaurant.findById(req.params.restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
        // const payload={...req.body,
        //   sizes: JSON.parse(req.body.sizes),
        //   additionalItems: JSON.parse(req.body.additionalItems)
        // }
      const {path: filePath}= file;
       const storagePath= `MenuImg/${file.filename}`;
      const imagePath = `gs://${config.storageBucket}/MenuImg/${file.filename}`;
      await uploadFileFirebaseService(filePath,`MenuImg/${file.filename}`);
      const signedUrl= await createPublicUrlService(`MenuImg/${file.filename}`);
      const menuData = {...req.body,  
                sizes: JSON.parse(req.body.sizes),
                additionalItems: JSON.parse(req.body.additionalItems),
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl,
                restaurantId: restaurant._id // Add restaurant ID to the menu item
              };
      console.log(menuData);
      restaurant.menu.push(menuData);
      console.log("Worked>>>");

      await restaurant.save();
      console.log("Worked");
      res.status(201).json(restaurant.menu);
      console.log(restaurant,"<<Result");
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message  });
    }
     finally{
      fs.unlink(filePath,(error)=>{
        if(error){
          console.log("Could not delete file");
        }
      })
    }
  }

 static async updateMenuItem(req, res) {
  const file = req.file;
  let filePath;

  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Helper for parsing JSON safely
    const parseIfString = (value) => {
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
      }
      return value;
    };

    let storagePath, imagePath, signedUrl;

    //If user uploaded a new image
    if (file) {
      filePath = file.path;
      storagePath = `MenuImg/${file.filename}`;
      imagePath = `gs://${config.storageBucket}/MenuImg/${file.filename}`;
      await uploadFileFirebaseService(filePath, storagePath);
      signedUrl = await createPublicUrlService(storagePath);

      //Delete old image from Firebase if it exists
      if (menuItem.storagePath) {
        try {
          await deleteFile(menuItem.storagePath);
          console.log(`Old image ${menuItem.storagePath} deleted.`);
        } catch (err) {
          console.log(`Failed to delete old image: ${err.message}`);
        }
      }

      //Update image-related fields
      menuItem.storagePath = storagePath;
      menuItem.imgPath = imagePath;
      menuItem.publicImgUrl = signedUrl;
    }


    //Always update other fields
    menuItem.name = req.body.name ?? menuItem.name;
    menuItem.category = req.body.category ?? menuItem.category;
    menuItem.description = req.body.description ?? menuItem.description;
    menuItem.price = req.body.price ?? menuItem.price;
    menuItem.sizes = req.body.sizes ? parseIfString(req.body.sizes) : menuItem.sizes;
    menuItem.additionalItems = req.body.additionalItems ? parseIfString(req.body.additionalItems) : menuItem.additionalItems;

    await restaurant.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (filePath) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log("Failed to delete local file:", err.message);
        }
      });
    }
  }
}

}

module.exports = MenuController;
