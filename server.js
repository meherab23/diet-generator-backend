// server.js
// Import dependencies
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser'); // Import cookie-parser

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware setup

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'], // Allow both frontend origins
  credentials: true, // Allow credentials (cookies) to be sent
}));
app.use(express.json());
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Use cookie-parser middleware
app.use(morgan('dev')); // Logger middleware for HTTP requests

// Import the database connection function
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('Diet Generator Backend API');
});

// Route imports
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes.js');
const dietRoutes = require('./routes/dietRoutes.js');
// const categoryRoutes = require('./routes/categoryRoutes');
// const butcheryRoutes = require('./routes/butcheryRoutes');
// const productRoutes = require('./routes/productRoutes');
// const eventRoutes = require('./routes/eventRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const promoCodeRoutes = require('./routes/promoCodeRoutes');
// const weeklyOfferRoutes = require('./routes/weeklyOfferRoutes');
// const bannerAdsRoutes = require('./routes/bannerAdsRoutes');
// const productAdsRoutes = require('./routes/productAdsRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diet', dietRoutes);
// app.use('/api/butchery', butcheryRoutes);
// app.use('/api/product', productRoutes);
// app.use('/api/event', eventRoutes);
// app.use('/api/order', orderRoutes);
// app.use('/api/category', categoryRoutes);
// app.use("/api/promocodes", promoCodeRoutes);
// app.use('/api/weeklyoffers', weeklyOfferRoutes);
// app.use('/api/bannerads', bannerAdsRoutes);
// app.use('/api/productads', productAdsRoutes);
// app.use('/api/payment', paymentRoutes);

// Handle 404 for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});



// Port configuration
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port} : http://localhost:${port}`);
});




// Use routes

