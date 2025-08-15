// routes/deliveryCompany.routes.ts
//import express from 'express';
// const {imageUpload} = require('../middleware/imageUpload')
const express = require("express")
// const {
//   getAllCompanies,
//   createCompany,
//   updateCompany,
//   deleteCompany
// } = require('../controllers/deliveryCompanyController')
//import { verifyToken, restrictTo } from '../middleware/auth';
const { verifyToken , restrictTo }= require('../middleware/auth')
const router = express.Router();
const { imageUpload } = require('../middleware/imageUpload')
const { auth } = require('../middleware/auth');
const DeliveryController = require("../controllers/deliveryCompanyController");

// Only "deli-admin" can access
// router.use(verifyToken);
// router.use(restrictTo('deli-admin'));

router.get('/',DeliveryController.getAllCompanies);
router.post('/', auth, imageUpload ,DeliveryController.createCompany);
router.put('/:id',  auth, imageUpload ,DeliveryController.updateCompany);
router.delete('/:id',auth, DeliveryController.deleteCompany);
 
module.exports = router;
