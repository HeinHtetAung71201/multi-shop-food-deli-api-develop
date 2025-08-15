const fs = require('fs');
const Category = require('../models/Category');
const config = require('../config/config');
const { uploadFileFirebaseService, createPublicUrlService, deleteFile } = require('../config/firebase');

class CategoryController {
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.find()
        .populate('restaurantCount')
        .sort({ sortOrder: 1, name: 1 });
      
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id)
        .populate('restaurantCount');
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createCategory(req, res) {
 
        const file = req.file;
          if (!file) {
              return res.status(400).json({
                  success: false,
                  message: "NO_CATEGORY_PHOTO",
                  error: "Upload a category photo",
              });
          }

        const { path: filePath } = file;
        // console.log(file)
     try {
        const storagePath = `CategoryImg/${file.filename}`
        const imagePath = `gs://${config.storageBucket}/CategoryImg/${file.filename}`

        await uploadFileFirebaseService (filePath, `CategoryImg/${file.filename}`)
        const signedUrl = await createPublicUrlService(`CategoryImg/${file.filename}`)

        const categoryData = {...req.body,  
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl
              };
      console.log(categoryData, "catetory data")
      const category = new Category(categoryData);
      await category.save();
      
      res.status(201).json(category);
      //res.status(201).send(category);
    } catch (error) {
      console.error('Create category error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      res.status(500).json({ message: 'Server error' });
    } finally {
        // delete uploaded file
        fs.unlink(filePath, (error) => {
            if (error) {
                logger.info("Could not delete file")
            }
        })

    }
  }

  static async updateCategory(req, res) {
       const file = req.file;
       let updatedCategory;
       let filePath;
          // if (!file) {
          //     return res.status(400).json({
          //         success: false,
          //         message: "NO_CATEGORY_PHOTO",
          //         error: "Upload a category photo",
          //     });
          // }

        

        const foundCat= await Category.findById(req.params.id)
        console.log("<<Found!",foundCat._id);
        console.log("Url!",foundCat.storagePath);
        
        
        if(!foundCat){
          return res.status(400).json({
                  success: false,
                  message: "NOt Found",
                  error: "FoundCategory Error",
              });
        }
        // const { path: filePath } = file;
  try {
       if(file){
        filePath=file.path;
        const storagePath = `CategoryImg/${file.filename}`
        const imagePath = `gs://${config.storageBucket}/CategoryImg/${file.filename}`

        await uploadFileFirebaseService (filePath, `CategoryImg/${file.filename}`)
        const signedUrl = await createPublicUrlService(`CategoryImg/${file.filename}`)
    // console.log('Updating category with ID:', req.params.id);
    // console.log('Update data:', req.body);
  const categoryData = {...req.body,  
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl
              };
     updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
       categoryData,
       { new: true, runValidators: true });
       deleteFile(foundCat.storagePath)
    }
else{
  updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      console.log("Update without photo is successful");
      
}
      
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  finally {
    if(file) {
        fs.unlink(filePath, (error) => {
                  if (error) {
                      console.log("Could not delete file")
                  }
              })
    }
        // delete uploaded file
    
    }
}


  static async deleteCategory(req, res) {
    try {
      const deletedCategory = await Category.findByIdAndDelete(req.params.id);
      deleteFile(deletedCategory.storagePath)
      if (!deletedCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = CategoryController;
