// import { Request, Response } from 'express';
// import DeliveryCompany from '../models/DeliveryCompany.model';
const fs = require('fs');
const config = require('../config/config');
const { uploadFileFirebaseService, createPublicUrlService, deleteFile } = require('../config/firebase');
const  DeliveryCompany = require('../models/DeliveryCompany');
const { response } = require('express');
const { log } = require('console');

class DeliveryController {

//get 
 static async getAllCompanies (req, res)  {
    try {
        const companies = await DeliveryCompany.find();
        res.json(companies);
    } catch (error) {
    res.status(500).json({ message: 'Failed to fetch delivery companies', error });
    }
};

//create
static async createCompany  (req, res) {
        const file = req.file;
          if (!file) {
              return res.status(400).json({
                  success: false,
                  message: "NO_DELIVERY_COMPANY_PHOTO",
                  error: "Upload a delivery company photo",
              });
          }

        const { path: filePath } = file;
        // console.log(file)
     try {
        const storagePath = `DeliveryImg/${file.filename}`
        const imagePath = `gs://${config.storageBucket}/DeliveryImg/${file.filename}`

        await uploadFileFirebaseService (filePath, `DeliveryImg/${file.filename}`)
        const signedUrl = await createPublicUrlService (`DeliveryImg/${file.filename}`)

        const deliveryData = {...req.body,  
                storagePath: storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl
              };
console.log(deliveryData, "deliry data")
        const newCompany = new DeliveryCompany(deliveryData);
        await newCompany.save();
        res.status(201).json(newCompany);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create delivery company', error });
    }
};

    // DB save
static async createCompany(req, res) {
  let filePath = null;

  try {
    const file = req.file;
    if (file) {
      filePath = file.path;

      const storagePath = `DeliveryImg/${file.filename}`;
      const imagePath = `gs://${config.storageBucket}/${storagePath}`;
      
      // Upload to Firebase
      await uploadFileFirebaseService(filePath, storagePath);
      const signedUrl = await createPublicUrlService(storagePath);

      const newCompany = new DeliveryCompany({
        name: req.body.name,
        staff: req.body.staff,
        fee: req.body.fee,
        email: req.body.email,
        status: req.body.status,
        storagePath,
        imgPath: imagePath,
        publicImgUrl: signedUrl
      });

      const savedCompany = await newCompany.save();

      return res.status(201).json({
        success: true,
        message: "Delivery company created",
        data: savedCompany
      });

    } else {
      // If no file uploaded
      const newCompany = new DeliveryCompany({
        name: req.body.name,
        staff: req.body.staff,
        fee: req.body.fee,
        email: req.body.email,
        status: req.body.status
      });

      const savedCompany = await newCompany.save();

      return res.status(201).json({
        success: true,
        message: "Delivery company created (no image)",
        data: savedCompany
      });
    }
  } catch (error) {
    console.error("Create delivery company error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create delivery company",
      error: error.message || error
    });

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



//update
static async updateCompany(req, res) {
    const file = req.file;
    let updatedDeliveryCompany;
    let filePath = null; 

    try {
        const foundDeliver = await DeliveryCompany.findById(req.params.id);

        if (!foundDeliver) {
            return res.status(400).json({
                success: false,
                message: "Not Found",
                error: "FoundDeliver Error",
            });
        }

        if (file) {
            filePath = file.path;
            console.log("FilePath<<<", filePath);

            const storagePath = `DeliveryImg/${file.filename}`;
            const imagePath = `gs://${config.storageBucket}/DeliveryImg/${file.filename}`;

            await uploadFileFirebaseService(filePath, storagePath);
            const signedUrl = await createPublicUrlService(storagePath);

            const deliveryData = {
                ...req.body,
                storagePath,
                imgPath: imagePath,
                publicImgUrl: signedUrl,
            };

            updatedDeliveryCompany = await DeliveryCompany.findByIdAndUpdate(
                req.params.id,
                deliveryData,
                { new: true, runValidators: true }
            );

            deleteFile(foundDeliver.storagePath);
        } else {
            updatedDeliveryCompany = await DeliveryCompany.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            console.log("Updated without photo is successfully");
        }

        if (!updatedDeliveryCompany) {
            return res.status(404).json({ message: 'Delivery Company not found' });
        }

        res.status(200).json(updatedDeliveryCompany);
    } catch (error) {
        console.error('Error updating Delivery Company:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        if (filePath) {
            fs.unlink(filePath, (error) => {
                if (error) {
                    console.log("Could not delete file");
                }
            });
        }
    }
}



//delete
 static async deleteCompany  (req,res) {
    try {
        const { id } = req.params;
        const deletedCompany= await DeliveryCompany.findByIdAndDelete(id);
        deleteFile(deletedCompany.storagePath);
        if (!deletedCompany) {
            return res.status(404).json({ message: 'Delivery company not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete delivery company', error });
    }
};
}
module.exports = DeliveryController;
