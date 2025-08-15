# FoodFlow Backend API

A comprehensive Node.js backend for a multi-role food delivery system built with MongoDB, Express.js, and Socket.io.

## Features

### 🏗️ **Architecture**
- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **Real-time updates** with Socket.io
- **JWT Authentication** with role-based access control
- **File uploads** with Cloudinary integration
- **Payment processing** with Stripe
- **SMS/Email notifications** with Twilio/NodeMailer

### 👥 **Multi-Role System**
- **Super Admin**: System-wide management
- **Shop Admin**: Restaurant management
- **Delivery Admin**: Delivery company management
- **Delivery Staff**: Order delivery and asset collection
- **Customer**: Food ordering and tracking

### 📊 **Core Features**
- **User Management**: Registration, authentication, profiles
- **Shop Management**: Restaurant creation, menu management
- **Order Processing**: Complete order lifecycle
- **Delivery Management**: Assignment, tracking, completion
- **Asset Tracking**: Lendable items management
- **Review System**: Ratings and feedback
- **Analytics**: Performance metrics and insights
- **Notifications**: Multi-channel communication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 5.0+
- Redis (optional, for caching)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── User.js       # User management
│   ├── Shop.js       # Restaurant data
│   ├── MenuItem.js   # Menu items
│   ├── Order.js      # Order processing
│   ├── DeliveryCompany.js
│   ├── Review.js     # Ratings & reviews
│   ├── Asset.js      # Asset tracking
│   ├── Category.js   # Food categories
│   ├── Notification.js
│   └── Analytics.js  # Performance metrics
├── routes/           # API endpoints
├── middleware/       # Authentication & validation
├── utils/           # Helper functions
├── controllers/     # Business logic
└── services/        # External integrations
```

## 🔐 Authentication & Authorization

### JWT Token-based Authentication
```javascript
// Protected route example
router.get('/profile', protect, async (req, res) => {
  res.json({ user: req.user });
});
```

### Role-based Access Control
```javascript
// Admin-only route
router.post('/shops', protect, authorize('super-admin', 'shop-admin'), createShop);
```

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum,
  phone: String,
  avatar: String,
  addresses: [AddressSchema],
  paymentMethods: [PaymentMethodSchema],
  preferences: PreferencesSchema,
  stats: StatsSchema
}
```

### Shop Model
```javascript
{
  name: String,
  description: String,
  image: String,
  category: String,
  location: LocationSchema,
  operatingHours: OperatingHoursSchema,
  deliverySettings: DeliverySettingsSchema,
  rating: RatingSchema,
  stats: StatsSchema
}
```

### Order Model
```javascript
{
  orderNumber: String (unique),
  customer: ObjectId,
  shop: ObjectId,
  items: [OrderItemSchema],
  pricing: PricingSchema,
  delivery: DeliverySchema,
  status: Enum,
  statusHistory: [StatusHistorySchema],
  payment: PaymentSchema,
  assets: AssetsSchema
}
```

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/forgot       # Password reset
```

### Users
```
GET    /api/users           # Get all users (admin)
GET    /api/users/:id       # Get user by ID
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

### Shops
```
GET    /api/shops           # Get shops (with filters)
POST   /api/shops           # Create shop
GET    /api/shops/:id       # Get shop details
PUT    /api/shops/:id       # Update shop
DELETE /api/shops/:id       # Delete shop
```

### Menu Items
```
GET    /api/menu/shop/:shopId    # Get shop menu
POST   /api/menu                 # Create menu item
PUT    /api/menu/:id             # Update menu item
DELETE /api/menu/:id             # Delete menu item
```

### Orders
```
GET    /api/orders               # Get orders
POST   /api/orders               # Create order
GET    /api/orders/:id           # Get order details
PUT    /api/orders/:id/status    # Update order status
```

### Assets
```
GET    /api/assets               # Get assets
POST   /api/assets               # Create asset
GET    /api/assets/lending       # Get lending history
POST   /api/assets/:id/lend      # Lend asset
PUT    /api/assets/:id/return    # Return asset
```

## 🔄 Real-time Features

### Socket.io Events
```javascript
// Order status updates
io.to(`order-${orderId}`).emit('orderStatusUpdate', {
  orderId,
  status,
  timestamp
});

// Delivery tracking
io.to(`delivery-${deliveryId}`).emit('locationUpdate', {
  lat,
  lng,
  timestamp
});
```

## 📈 Analytics & Metrics

### Daily Analytics
- Order metrics (total, completed, cancelled)
- Revenue tracking
- Customer analytics
- Popular items
- Peak hours analysis

### Real-time Metrics
- Active orders/deliveries
- Current customers online
- System performance

### Performance Monitoring
- API response times
- Database query performance
- System resource usage

## 🔧 Configuration

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/foodflow

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# SMS
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# Payments
STRIPE_SECRET_KEY=sk_test_...

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

## 🛡️ Security Features

- **Password hashing** with bcrypt
- **JWT token** authentication
- **Rate limiting** to prevent abuse
- **Input validation** with express-validator
- **CORS** configuration
- **Helmet** for security headers
- **Data sanitization**

## 📱 Integration Features

### Payment Processing
- Stripe integration for card payments
- Webhook handling for payment events
- Refund processing

### Notifications
- Email notifications with NodeMailer
- SMS notifications with Twilio
- Push notifications with Firebase
- In-app notifications

### File Management
- Image upload with Cloudinary
- File validation and processing
- Automatic image optimization

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Setup
```bash
# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 Monitoring & Logging

- **Winston** for structured logging
- **Morgan** for HTTP request logging
- **Performance metrics** collection
- **Error tracking** and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.