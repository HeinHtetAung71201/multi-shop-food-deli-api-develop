const { getStorage } = require('firebase-admin/storage');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// 📌 Main function for uploading file buffer to Firebase Storage
const uploadImageToFirebase = async (file) => {
  const bucket = getStorage().bucket(); // Firebase bucket connection
  const filename = `delivery-companies/${Date.now()}-${file.originalname}`; // Unique filename
  const fileUpload = bucket.file(filename);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: uuidv4(), // token for access
      },
    },
  });

  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media;
  return imageUrl`;
};

module.exports = { uploadImageToFirebase };