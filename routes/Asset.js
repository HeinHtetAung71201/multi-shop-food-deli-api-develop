const express = require('express');
const { auth } = require('../middleware/auth');
const { imageUpload } = require('../middleware/imageUpload')
const AssetController = require('../controllers/AssetController');
const router = express.Router();

router.get('/', auth, AssetController.getAssets);
router.post('/', auth , imageUpload , AssetController.createAsset);
router.put('/:id', auth, imageUpload,AssetController.updateAsset);
router.delete('/:id', auth,AssetController.deleteAsset);


module.exports = router;
