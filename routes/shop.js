const express = require('express');
const ShopController = require('../controllers/shopController');
const router = express.Router();

router.get('/',ShopController.getAllShops);

router.get('/:id',ShopController.getShopById);

router.post('/',ShopController.createShop);

router.put('/:id',ShopController.updateShop);

router.delete('/:id',ShopController.deleteShop);

module.exports= router;
