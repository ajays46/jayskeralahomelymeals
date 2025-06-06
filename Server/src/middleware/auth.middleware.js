const jwt = require('jsonwebtoken');
const Auth = require('../models/auth');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  try {
    // Get tokens from cookies
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // If no tokens found, return unauthorized
    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    let decoded;
    let auth;

    try {
      // Try to verify access token first
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
      auth = await Auth.findByPk(decoded.id);
    } catch (error) {
      // If access token is invalid/expired, try refresh token
      if (refreshToken) {
        try {
          decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
          auth = await Auth.findByPk(decoded.id);
        } catch (refreshError) {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }
    }

    // Check if user exists and is active
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (auth.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Add user to request object
    req.user = {
      id: auth.id,
      email: auth.email
    };

    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
}; 