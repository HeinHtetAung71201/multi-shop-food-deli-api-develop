// models/DeliveryCompany.model.ts
//import mongoose from 'mongoose';
const mongoose = require('mongoose')
const DeliveryCompanySchema = new mongoose.Schema({
   storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    publicImgUrl: {
        type: String,
    },
  name: 
  { type: String, 
    required: true },
  staff: 
  { type: Number, 
    default: 0 },
  fee: 
  { type: Number, 
    required: true },
  email:
  { type: String, 
    required: true },
  status: 
  { type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' },
     storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    storagePath:{
       type: String,
    },
    publicImgUrl: {
        type: String,
    },
}, 
{ timestamps: true });

module.exports = mongoose.model('DeliveryCompany', DeliveryCompanySchema);