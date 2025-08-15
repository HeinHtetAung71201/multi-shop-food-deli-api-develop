const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { imageUpload } = require('../middleware/imageUpload')
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all categories
router.get('/', CategoryController.getAllCategories);

// Get category by ID
router.get('/:id', CategoryController.getCategoryById);

// Create a new category
router.post('/', auth, imageUpload , CategoryController.createCategory);

// Update a category
router.put('/:id',  auth, imageUpload , CategoryController.updateCategory);


// Delete a category (soft delete)
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;