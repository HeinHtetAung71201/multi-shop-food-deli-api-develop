const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocationSchema = new Schema({
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const ShopSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  rating: { type: Number, default: 0 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  location: { type: LocationSchema, required: true },
  openTime: { type: String, required: true },   // e.g. '10:00'
  closeTime: { type: String, required: true },  // e.g. '22:00'
}, {
  timestamps: true
});

module.exports = mongoose.model('Shop', ShopSchema);
