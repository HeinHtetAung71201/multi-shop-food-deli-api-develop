
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');

const { uploadFileFirebaseService, createPublicUrlService, deleteFile } = require('../config/firebase');
const config = require('../config/config');
const fs = require('fs');
const { storage } = require('firebase-admin');

class RestaurantController {
  // static async getRestaurants(req, res) {
  //   try {
  //     const { 
  //       category, 
  //       search, 
  //       page = 1, 
  //       limit = 10, 
  //       sortBy = 'rating', 
  //       lat, 
  //       lng, 
  //       radius = 10 
  //     } = req.query;
      
  //     const skip = (page - 1) * limit;
  //     // let query = { isVerified: true };
  //        let query = {  };
  //     // Category filter
  //     if (category) {
  //       query.category = category;
  //     }
      
  //     // Search filter
  //     if (search) {
  //       query.$or = [
  //         { name: { $regex: search, $options: 'i' } },
  //         { description: { $regex: search, $options: 'i' } },
  //         { cuisine: { $in: [new RegExp(search, 'i')] } }
  //       ];
  //     }
      
  //     // Location filter
  //     if (lat && lng) {
  //       query['address.coordinates'] = {
  //         $nearSphere: {
  //           $geometry: {
  //             type: 'Point',
  //             coordinates: [parseFloat(lng), parseFloat(lat)]
  //           },
  //           $maxDistance: radius * 1000 // Convert km to meters
  //         }
  //       };
  //     }
      
  //     // Sorting
  //     let sort = {};
  //     switch (sortBy) {
  //       case 'rating':
  //         sort = { 'rating.average': -1, 'rating.count': -1 };
  //         break;
  //       case 'delivery-time':
  //         sort = { 'deliveryTime.min': 1 };
  //         break;
  //       case 'delivery-fee':
  //         sort = { deliveryFee: 1 };
  //         break;
  //       case 'name':
  //         sort = { name: 1 };
  //         break;
  //       default:
  //         sort = { createdAt: -1 };
  //     }
      
  //     const restaurants = await Restaurant.find()
  //       .sort(sort)
  //       .skip(skip)
  //       .limit(parseInt(limit))
  //       .populate('ownerId', 'name email')
  //       .populate('category','name');
      
  //     const total = await Restaurant.countDocuments(query);
      
  //     res.json({
  //       restaurants,
  //       pagination: {
  //         page: parseInt(page),
  //         limit: parseInt(limit),
  //         total,
  //         pages: Math.ceil(total / limit)
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Get restaurants error:', error);
  //     res.status(500).json({ message: 'Server error',error:error.message });
  //   }
  // }
  static async getRestaurants(req, res) { 
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'rating', 
      lat, 
      lng, 
      radius = 10 
    } = req.query;
    
    const skip = (page - 1) * limit;
    let query = {};

    // Category filter
   if (category) {
  // If category is not a valid ObjectId, treat it as a name and look up the ObjectId
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(category)) {
    const categoryDoc = await Category.findOne({ name: category });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else {
      // No such category, return empty result
      return res.json({
        restaurants: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }
  } else {
    query.category = category;
  }
}
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Location filter
    if (lat && lng) {
      query['address.coordinates'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }
    
    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'delivery-time':
        sort = { 'deliveryTime.min': 1 };
        break;
      case 'delivery-fee':
        sort = { deliveryFee: 1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
    
    const restaurants = await Restaurant.find(query)
      .sort({ rating: -1 })
      .populate('ownerId', 'name email')
      .populate('category', 'name'); 
    
    const total = await Restaurant.countDocuments(query);
    
    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }
   catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


  static async getRestaurantById(req,res) {
    const { id } = req.params;
    try {
      console.log(id,"requestRestaurant")
      const restaurant = await Restaurant.findById(id);
      console.log(restaurant,"<<<restaurant");
        // .populate('ownerId', 'name email phone');
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error('Get restaurant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createRestaurant(req, res) {
   
   console.log(req,"requested Data");
    const file= req.file;
    if(!file){
      return res.status(400).json({
        success:false,
        message:"No restaurant Photo",
        error:"upload restaurant photo",
      })
    }

    const {path: filePath}= file;
    console.log(file);
    try {
    const storagePath= `RestaurantImg/${file.filename}`;
      const imagePath = `gs://${config.storageBucket}/RestaurantImg/${file.filename}`;
      await uploadFileFirebaseService (filePath,`RestaurantImg/${file.filename}`);
      const signedUrl= await createPublicUrlService(`RestaurantImg/${file.filename}`);
    
      const restaurantData = {
        ...req.body,
        address: JSON.parse(req.body.address),
         storagePath: storagePath,
        imgPath: imagePath,
        publicImgUrl: signedUrl,
        ownerId: req.user.id
      };
      
      const restaurant = new Restaurant(restaurantData);
      await restaurant.save();
      
      res.status(201).json(restaurant);
    } catch (error) {
      console.error('Create restaurant error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
     finally{
          fs .unlink(filePath,(error)=>{
            if(error){
              console.log("Could not delete file");
            }
          })
        }
  }

  // static async updateRestaurant(req, res) {
  //  const file= req.file;
  //   if(!file){
  //     return res.status(400).json({
  //       success:false,
  //       message:"No restaurant Photo",
  //       error:"upload restaurant photo",
  //     })
  //   }

  //   const {path: filePath}= file;
  //     const storagePath= `RestaurantImg/${file.filename}`;
  //     const imagePath = `gs://${config.storageBucket}/MenRestaurantImguImg/${file.filename}`;
  //     await uploadFileFirebaseService(filePath,`RestaurantImg/${file.filename}`);
  //     const signedUrl= await createPublicUrlService(filePath,`RestaurantImg/${file.filename}`);
  //   try {

  //      const restaurantData = {
  //       ...req.body,
  //       address: JSON.parse(req.body.address),
  //        storagePath: storagePath,
  //       imgPath: imagePath,
  //       publicImgUrl: signedUrl,
  //       ownerId: req.user.id
  //     };

  //     const restaurant = await Restaurant.findOneAndUpdate(
  //       { _id: req.params.id,
  //          ownerId: req.user.id },
  //       restaurantData  ,
  //       { new: true, runValidators: true }
  //     );
  //     res.json(restaurant);
  //   } catch (error) {
  //     console.error('Update restaurant error:', error);
  //     res.status(500).json({ message: 'Server error', error: error.message });
  //   }
  //   finally{
  //         fs.unlink(filePath,(error)=>{
  //           if(error){
  //             console.log("Could not delete file");
  //           }
  //         })
  //       }
  // }

static async updateRestaurant(req, res) {
  const file = req.file;
  let filePath;

  try {
    // Fetch existing restaurant
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    let storagePath, imagePath, signedUrl;

    // 2If new photo uploaded
    if (file) {
      filePath = file.path;
      storagePath = `RestaurantImg/${file.filename}`;
      imagePath = `gs://${config.storageBucket}/RestaurantImg/${file.filename}`;
      
      await uploadFileFirebaseService(filePath, storagePath);
      signedUrl = await createPublicUrlService(storagePath);

      // Delete old photo if exists
      if (restaurant.storagePath) {
        try {
          await deleteFile(restaurant.storagePath);
          console.log(`Old restaurant photo ${restaurant.storagePath} deleted.`);
        } catch (err) {
          console.log(`Failed to delete old restaurant photo: ${err.message}`);
        }
      }

      // Update image-related fields
      restaurant.storagePath = storagePath;
      restaurant.imgPath = imagePath;
      restaurant.publicImgUrl = signedUrl;
    }

    // Update other restaurant fields (always)
    restaurant.isOpen= req.body.isOpen ?? restaurant.isOpen;
    restaurant.name = req.body.name ?? restaurant.name;
    restaurant.category = req.body.category ?? restaurant.category;
    restaurant.description = req.body.description ?? restaurant.description;
    restaurant.address = req.body.address ? JSON.parse(req.body.address) : restaurant.address;

    await restaurant.save();

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant,
    });

  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (filePath) {
      fs.unlink(filePath, (err) => {
        if (err) console.log("Failed to delete local file:", err.message);
      });
    }
  }
}


  static async deleteRestaurant(req, res) {
    try {
      const restaurant = await Restaurant.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.user.id
      });
      await deleteFile(restaurant.storagePath);//worked
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
      }

      res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
      console.error('Delete restaurant error:', error);
      res.status(500).json({ message: 'Server error',error: error.message });
    }
  }

  static async toggleRestaurantStatus(req, res) {
    try {
      const { isOpen, isPaused } = req.body;
      
      const restaurant = await Restaurant.findOneAndUpdate(
        { _id: req.params.id, ownerId: req.user.id },
        { isOpen, isPaused },
        { new: true }
      );
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error('Toggle restaurant status error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getFeaturedRestaurants(req, res) {
    try {
      const restaurants = await Restaurant.find({
        isVerified: true,
        isOpen: true,
        'rating.average': { $gte: 4.0 }
      })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(10);
      
      res.json(restaurants);
    } catch (error) {
      console.error('Get featured restaurants error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getMyRestaurants(req, res) {
    try {
      const restaurants = await Restaurant.find({ ownerId: req.user.id })
        .sort({ createdAt: -1 });
      
      res.json(restaurants);
    } catch (error) {
      console.error('Get my restaurants error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = RestaurantController;
