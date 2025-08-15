const config = {
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
  jwtExpire: process.env.JWT_EXPIRE,
  imgStoragePath: process.env.IMG_STORAGE_PATH,
  salt: process.env.SALT,
  redisHost: process.env.REDIS_URL,
  redisPw: process.env.REDIS_PW,
  redisPort: process.env.REDIS_PORT,
  mongodbUrl: process.env.MONGODB_URI,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey : process.env.FIREBASE_PRIVATE_KEY,
    
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  maxFileSize: process.env.MAX_FILE_SIZE,
  uploadPath: process.env.UPLOAD_PATH,
  allowOrigins: process.env.ALLOWED_ORIGINS,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET


}
module.exports = config;