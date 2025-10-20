import { logInfo, logError, logWarning, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Logging Middleware - Request/response logging and performance tracking
 * Features: Request logging, response logging, performance metrics, error tracking
 */

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Add request ID if not present
  if (!req.requestId) {
    req.requestId = req.headers['x-request-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Override res.end to log response (this will log both request and response in one entry)
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log complete request/response cycle
    logInfo(LOG_CATEGORIES.SYSTEM, 'API Request/Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId,
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    });
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logWarning(LOG_CATEGORIES.PERFORMANCE, 'Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        requestId: req.requestId
      });
    }
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logError(LOG_CATEGORIES.SYSTEM, 'Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    requestId: req.requestId,
    userId: req.user?.id || null,
    ip: req.ip || req.connection.remoteAddress
  });
  
  next(err);
};

// Database query logging helper
export const logDatabaseQuery = (query, duration, rowCount = null) => {
  logInfo(LOG_CATEGORIES.TRANSACTION, 'Database query executed', {
    query: query,
    duration: `${duration}ms`,
    rowCount: rowCount
  });
};

// Business action logging helper
export const logBusinessAction = (action, entity, entityId, userId = null, metadata = {}) => {
  logInfo(LOG_CATEGORIES.SYSTEM, `Business action: ${action}`, {
    action,
    entity,
    entityId,
    userId,
    metadata
  });
};

// Security event logging helper
export const logSecurityEvent = (event, userId = null, ip = null, metadata = {}) => {
  logWarning(LOG_CATEGORIES.SECURITY, `Security event: ${event}`, {
    event,
    userId,
    ip,
    metadata
  });
};

// Performance logging helper
export const logPerformance = (operation, startTime, metadata = {}) => {
  logInfo(LOG_CATEGORIES.PERFORMANCE, `Performance: ${operation}`, {
    operation,
    startTime,
    metadata
  });
};

export default {
  requestLogger,
  errorLogger,
  logDatabaseQuery,
  logBusinessAction,
  logSecurityEvent,
  logPerformance
};

