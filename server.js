const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
 const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const favoriteRoutes = require('./routes/favorites');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const deliveryCompanyRoutes = require('./routes/deliveryCompany');
const shopRoutes = require('./routes/shop');
const assetRoutes = require('./routes/Asset');
const activityRoutes= require('./routes/activityRoutes');

// Import middleware & config
const errorHandler = require('./middleware/errorHandler');
const { initializeFirebase } = require('./config/firebase');
const { connectRedis } = require('./config/redis');
const socketHandler = require('./socket/socketHandler');
const config = require('./config/config');

// App setup
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {

    origin: config.nodeEnv === 'production' ? 
      ["https://food.nexacoreitsolution.com"] : 
      ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.url === '/api/health'
});
//app.use('/api', limiter);

// CORS
app.use(cors({
  origin: config.nodeEnv === 'production' ? 
    ["https://food.nexacoreitsolution.com"] : 
    ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

mongoose.connect(config.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Firebase & Redis
initializeFirebase();
//connectRedis();

// Socket.IO
socketHandler(io);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery-companies', deliveryCompanyRoutes );
app.use('/api/asset', assetRoutes);
app.use('/api/activities',activityRoutes)


// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// Error 
app.use(errorHandler);

//404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };