const Asset = require('../models/Asset');
const fs = require('fs')
const { uploadFileFirebaseService, createPublicUrlService, deleteFile } = require('../config/firebase');
const config = require('../config/config');

class AssetController {
  static async getAssets(req, res) {
    try {
    
      const assets = await Asset.find()
       

      res.json({
        assets,
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }


  //create
static async createAsset  (req, res) {
  

        const file = req.file;
          if (!file) {
              return res.status(400).json({
                  success: false,
                  message: "NO_ASSET_MANAGEMENT_PHOTO",
                  error: "Upload Asset Management photo",
              });
          }

        const { path: filePath } = file;
         console.log(file)
     try {
        const storagePath = `AssetImg/${file.filename}`
        const imagePath = `gs://${config.storageBucket}/AssetImg/${file.filename}`

        await uploadFileFirebaseService (filePath, `AssetImg/${file.filename}`)
        const signedUrl = await createPublicUrlService (`AssetImg/${file.filename}`)

        const AssetData = {...req.body,  
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl
              };
console.log(AssetData, "Asset data")
        const newAsset = new Asset (AssetData);
        await newAsset.save();
       console.log(newAsset, "new asset")
        res.status(201).json(newAsset);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create Asset Management', error });
    }
    finally {
            // delete uploaded file
            fs.unlink(filePath, (error) => {
                if (error) {
                    console.log("Could not delete file")
                }
            })
    
        }
};


  static async updateAsset(req, res) {
       const file = req.file;
       let updatedAsset;
       let filePath;
          // if (!file) {
          //     return res.status(400).json({
          //         success: false,
          //         message: "NO_CATEGORY_PHOTO",
          //         error: "Upload a category photo",
          //     });
          // }

        

        const foundAsset= await Asset.findById(req.params.id)
        console.log("<<Found!",foundAsset._id);
        console.log("Url!",foundAsset.storagePath);
        
        
        if(!foundAsset){
          return res.status(400).json({
                  success: false,
                  message: "NOt Found",
                  error: "foundAssetegory Error",
              });
        }
        // const { path: filePath } = file;
  try {
       if(file){
        filePath=file.path;
        const storagePath = `AssetImg/${file.filename}`
        const imagePath = `gs://${config .storageBucket}/AssetImg/${file.filename}`

        await uploadFileFirebaseService (filePath, `AssetImg/${file.filename}`)
        const signedUrl = await createPublicUrlService(`AssetImg/${file.filename}`)
    // console.log('Updating category with ID:', req.params.id);
    // console.log('Update data:', req.body);
  const assetData = {...req.body,  
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl
              };
     updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
       assetData,
       { new: true, runValidators: true });
       deleteFile(foundAsset.storagePath)
    }
else {
  updatedAsset = await Asset.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      console.log("Update without photo is successful");
      
}
      
    if (!updatedAsset) {
      return res.status(404).json({ message: 'asset not found' });
    }

    res.status(200).json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
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
  }}


  // static async updateAsset(req, res) {
  //   try {
  //     const asset = await Asset.findByIdAndUpdate(
  //       req.params.id,
  //       req.body,
  //       { new: true, runValidators: true }
  //     );

  //     if (!asset) {
  //       return res.status(404).json({ message: 'Asset not found' });
  //     }

  //     res.json(asset);
  //   } catch (error) {
  //     console.error('Update asset error:', error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // }
  
  static async deleteAsset(req, res) {
  try {
    const { id } = req.params;

    const deletedAsset = await Asset.findByIdAndDelete(id);

    if (!deletedAsset) {
      return res.status(404).json({ message: 'not found asset' });
    }

    res.json({ message: 'Asset  delete', deletedAsset });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
} 


  static async getReviews(req, res) {
  try {
    // example response, or fetch real reviews
    res.json({ message: 'Get reviews called', restaurantId: req.params.restaurantId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
}

module.exports = AssetController;