const AppError = require('../utils/AppError');
const { ValidationError, UniqueConstraintError } = require('sequelize');

const errorHandler = (err, req, res, next) => {

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details || null
      }
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate Entry',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        details: 'The provided token is invalid'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        details: 'The provided token has expired'
      }
    });
  }

  // Final fallback
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    }
  });
};

module.exports = errorHandler;
