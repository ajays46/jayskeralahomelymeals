import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import './models/index.js'; // Import models to ensure associations are loaded
// import sequelize from './config/database.js';

dotenv.config();

const app = express();

// Middleware
console.log(process.env.NODE_ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL,
  credentials: true, // This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
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
  
      console.log('Database synced successfully.');
  
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Unable to sync database:', error);
    }
  })();
