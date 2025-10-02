/**
 * AppError - Custom error class for application-specific error handling
 * Provides structured error handling with status codes and operational error classification
 * Features: Status code management, operational error classification, error details, stack trace capture
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError; 