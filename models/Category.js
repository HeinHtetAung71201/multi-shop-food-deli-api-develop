
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  // description: {
  //   type: String,
  //   trim: true
  // },
    storagePath: {
        type: String,
    },
    imgPath: {
        type: String,
    },
    publicImgUrl: {
        type: String,
    },
  // icon: String,
   isActive: {
    type: Boolean,
    default: true
    },
  // sortOrder: {
  //  type: Number,
  //  default: 0
  //  },
  // parentCategory: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Category'
  // },
  // tags: [String],
  seoSlug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
}, 
{
  timestamps: true
});

// Generate SEO slug before saving
categorySchema.pre('save', function(next) {
  if (!this.seoSlug) {
    this.seoSlug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');
  }
  next();
});

// UPDATE - pre-findOneAndUpdate
categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.name) {
    update.seoSlug = generateSlug(update.name);
    this.setUpdate(update);
  }

  next();
});

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Virtual for restaurant count
categorySchema.virtual('restaurantCount', {
  ref: 'Restaurant',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
