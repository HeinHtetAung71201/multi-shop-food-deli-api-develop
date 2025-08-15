const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MIME_TYPE = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/png": "png",
};
const upload = multer({
  dest: path.join(".", "uploads"),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE[file.mimetype];
    const error = isValid
      ? null
      : "Please upload valid file types (JPEG, JPG, PNG)";
    cb(error, isValid);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(".", "uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.round(
        Math.random() * 1e9
      )}`;
      cb(null, uniqueSuffix + "_" + file.originalname);
    },
  }),
  limits: {
    fileSize: 0.5 * 1024 * 1024,
  },
}).single("filename");

const imageUpload = (req, res, next) => {
  if (!fs.existsSync(path.join(".", "uploads"))) {
    fs.mkdirSync(path.join(".", "uploads"), { recursive: true });
  }
  upload(req, res, (err) => {
    if (err) {
      console.log(err.message, "Image");
      
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          message: "LIMIT_FILE_SIZE",
          error: err,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "INVALID_FILE",
          error: err,
        });
      }
    } else {
      next();
    }
  });
};

module.exports = { imageUpload };

