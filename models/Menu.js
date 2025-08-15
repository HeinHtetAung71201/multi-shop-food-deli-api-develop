// const mongoose = require('mongoose');
// const { Schema } = mongoose;


// const menuItemSchema = new Schema({
//   restraunt: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
//   name: { type: String, required: true },
//   description: { type: String },
//   image: { type: String },
//   category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
//   BasePrice: { type: Number, required: true },
//   availableSizes: [ {  size: { type: String, required: true }, price: { type: Number, required: true } }],
//   additionalItems: [{
//     name: { type: String, required: true },
//     price: { type: Number, required: true }
//   }]
//   //rating: { type: Number, default: 0 },

// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('MenuItem', menuItemSchema);
