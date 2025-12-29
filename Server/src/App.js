/**
 * App - Main Express server application with middleware and route configuration
 * Handles API routing, static file serving, authentication, and error handling
 * Features: CORS, cookie parsing, file uploads, role-based authentication, external API integration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import addressRoutes from './routes/auth.address.route.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import deliveryItemRoutes from './routes/deliveryItem.routes.js';
import deliveryManagerRoutes from './routes/deliveryManager.routes.js';
import deliveryExecutiveRoutes from './routes/deliveryExecutive.routes.js';
import externalUploadRoutes from './routes/externalUpload.routes.js';
import financialRoutes from './routes/financial.routes.js';
import deliveryDashboardRoutes from './routes/deliveryDashboard.routes.js';
import sellerPerformanceRoutes from './routes/sellerPerformance.routes.js';
import customerAccessRoutes from './routes/customerAccess.routes.js';
import aiRouteRoutes from './routes/aiRoute.routes.js';
import driverMapsRoutes from './routes/driverMaps.routes.js';
import { requestLogger, errorLogger } from './middleware/logging.middleware.js';
import logRotationManager from './utils/logRotationManager.js';
import { logInfo, logError, LOG_CATEGORIES } from './utils/criticalLogger.js';
import path from 'path';
import fs from 'fs';
import './models/index.js'; // Import models to ensure associations are loaded
import prisma from './config/prisma.js';

dotenv.config();

const app = express();

// Serve static files with proper fallback handling
app.use('/uploads', (req, res, next) => {
  const serverFilePath = path.join(process.cwd(), 'src/services/uploads', req.path);
  const clientFilePath = path.join(process.cwd(), '../Client/public', req.path);
  
  // Check if file exists in server uploads first
  if (fs.existsSync(serverFilePath)) {

    res.sendFile(serverFilePath);
  } else if (fs.existsSync(clientFilePath)) {
    // Fallback to client public directory
    
    res.sendFile(clientFilePath);
  } else {
    // File doesn't exist anywhere, return 404
    
    res.status(404).json({ 
      error: 'File not found',
      message: `The requested file ${req.path} was not found`
    });
  }
});

// Serve payment receipt files from payment-receipts directory
app.use('/payment-receipts', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'src/services/payment-receipts', req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {

    res.sendFile(filePath);
  } else {
    // File doesn't exist, return 404
    
    res.status(404).json({ 
      error: 'Payment receipt not found',
      message: `The requested payment receipt ${req.path} was not found`
    });
  }
});

// Serve delivery detail images
app.use('/delivery-images', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'uploads/delivery-details', req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // File doesn't exist, return 404
    res.status(404).json({ 
      error: 'Delivery image not found',
      message: `The requested delivery image ${req.path} was not found`
    });
  }
});

// Test database connection and log success
prisma.$connect()
  .then(() => {

  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL,
  credentials: true, // This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Add logging middleware
app.use(requestLogger);

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
app.use('/api/seller', sellerRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/api/delivery-items', deliveryItemRoutes);
app.use('/api/delivery-managers', deliveryManagerRoutes);
app.use('/api/delivery-executives', deliveryExecutiveRoutes);
app.use('/api/external', externalUploadRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/delivery-dashboard', deliveryDashboardRoutes);
app.use('/api/seller-performance', sellerPerformanceRoutes);
app.use('/api/customer-portal', customerAccessRoutes);
app.use('/api/ai-routes', aiRouteRoutes);
app.use('/api/drivers', driverMapsRoutes); // Mount driver maps APIs at /api/drivers

// Error logging middleware (should be after routes but before error handler)
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
    // Log error using our critical logger
    logError(LOG_CATEGORIES.SYSTEM, 'Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        requestId: req.requestId,
        userId: req.user?.id || null
    });
    
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

(async () => {
    try {
      // Initialize log rotation system
      logRotationManager.start();
      logInfo(LOG_CATEGORIES.SYSTEM, 'Log rotation system initialized');
      
      // await sequelize.sync({ alter: true }); 
  
      // Database synced successfully
  
      app.listen(PORT, () => {
        logInfo(LOG_CATEGORIES.SYSTEM, 'Server started successfully', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        });
        console.log(`🚀 Server running on port ${PORT}`);
      });
    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Server startup failed', {
        error: error.message,
        stack: error.stack
      });
      console.error('❌ Unable to start server:', error);
    }
  })();
  console.log("Connected DB:", process.env.DATABASE_URL);
  

