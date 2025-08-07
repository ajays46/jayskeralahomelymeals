import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import addressRoutes from './routes/auth.address.route.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import deliveryItemRoutes from './routes/deliveryItem.routes.js';
import path from 'path';
import './models/index.js'; // Import models to ensure associations are loaded
// import sequelize from './config/database.js';

dotenv.config();

const app = express();

// Serve static files with proper fallback handling
app.use('/uploads', (req, res, next) => {
  const fs = require('fs');
  const serverFilePath = path.join(process.cwd(), 'src/services/uploads', req.path);
  const clientFilePath = path.join(process.cwd(), '../Client/public', req.path);
  
  // Check if file exists in server uploads first
  if (fs.existsSync(serverFilePath)) {
    console.log(`Serving from server uploads: ${req.path}`);
    res.sendFile(serverFilePath);
  } else if (fs.existsSync(clientFilePath)) {
    // Fallback to client public directory
    console.log(`Serving from client public: ${req.path}`);
    res.sendFile(clientFilePath);
  } else {
    // File doesn't exist anywhere, return 404
    console.log(`File not found: ${req.path}`);
    res.status(404).json({ 
      error: 'File not found',
      message: `The requested file ${req.path} was not found`
    });
  }
});

// Serve payment receipt files from payment-receipts directory
app.use('/payment-receipts', (req, res, next) => {
  const fs = require('fs');
  const filePath = path.join(process.cwd(), 'src/services/payment-receipts', req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log(`Serving payment receipt: ${req.path}`);
    res.sendFile(filePath);
  } else {
    // File doesn't exist, return 404
    console.log(`Payment receipt not found: ${req.path}`);
    res.status(404).json({ 
      error: 'Payment receipt not found',
      message: `The requested payment receipt ${req.path} was not found`
    });
  }
});

// Middleware

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL,
  credentials: true, // This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check endpoint for CI/CD pipeline
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', deliveryItemRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

(async () => {
    try {
      // await sequelize.sync({ alter: true }); 
  
      // Database synced successfully
  
      app.listen(PORT, () => {
        // Server is running on port ${PORT}
      });
    } catch (error) {
      // Unable to sync database
    }
  })();
