const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assetSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false
    },
     storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    publicImgUrl: {
        type: String,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);


//old
// const mongoose = require('mongoose');

// const assetSchema = new mongoose.Schema({

//   restaurantId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Restaurant',
//     required: true
//   },
 
//   name: {
//     type: String,
//     trim: true,
//     maxlength: 1000
//   },
//   qty: {
//     type: Number,
//     default: 0
//   }


// }, {
//   timestamps: true
// });



// module.exports = mongoose.model('Asset', assetSchema);
