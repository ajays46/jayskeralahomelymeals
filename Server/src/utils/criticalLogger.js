import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Critical Logger - Enhanced logging with daily rotation
 * Features: Critical event logging, daily file rotation, log levels, structured logging
 */

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Log categories
export const LOG_CATEGORIES = {
  PAYMENT: 'PAYMENT',
  INVENTORY: 'INVENTORY',
  USER_ROLES: 'USER_ROLES',
  TRANSACTION: 'TRANSACTION',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  SYSTEM: 'SYSTEM'
};

// Configuration
const LOG_CONFIG = {
  // Log directory structure
  baseDir: path.join(process.cwd(), 'logs'),
  subDirs: {
    daily: 'daily',
    critical: 'critical',
    errors: 'errors',
    transactions: 'transactions',
    archived: 'archived'
  },
  
  // Rotation settings
  rotation: {
    interval: 'daily', // daily, weekly, monthly
    maxFiles: 30, // Keep 30 days of logs
    compressOldLogs: true,
    compressAfterDays: 7 // Compress logs older than 7 days
  },
  
  // Log levels for different environments
  levels: {
    development: [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARNING, LOG_LEVELS.ERROR, LOG_LEVELS.CRITICAL],
    production: [LOG_LEVELS.WARNING, LOG_LEVELS.ERROR, LOG_LEVELS.CRITICAL]
  }
};

class CriticalLogger {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.ensureLogDirectories();
  }

  /**
   * Ensure all log directories exist
   */
  ensureLogDirectories() {
    const dirs = [
      LOG_CONFIG.baseDir,
      path.join(LOG_CONFIG.baseDir, LOG_CONFIG.subDirs.daily),
      path.join(LOG_CONFIG.baseDir, LOG_CONFIG.subDirs.critical),
      path.join(LOG_CONFIG.baseDir, LOG_CONFIG.subDirs.errors),
      path.join(LOG_CONFIG.baseDir, LOG_CONFIG.subDirs.transactions),
      path.join(LOG_CONFIG.baseDir, LOG_CONFIG.subDirs.archived)
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get log file path for a specific category and date
   */
  getLogFilePath(category, level, date = null) {
    const logDate = date || this.currentDate;
    const fileName = `app-${category.toLowerCase()}-${logDate}.log`;
    
    // All logs go to daily directory for now
    // We can separate them later if needed
    const subDir = LOG_CONFIG.subDirs.daily;
    
    return path.join(LOG_CONFIG.baseDir, subDir, fileName);
  }

  /**
   * Write log entry to file
   */
  writeToFile(filePath, logEntry) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.appendFileSync(filePath, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
      // Fallback to console logging
      console.log('FALLBACK LOG:', logEntry);
    }
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, category, message, context) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      context: this.sanitizeContext(context),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Sanitize context data for production
   */
  sanitizeContext(context) {
    if (process.env.NODE_ENV === 'production') {
      // Remove sensitive data in production
      const sanitized = { ...context };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.apiKey;
      delete sanitized.stack;
      return sanitized;
    }
    return context;
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const currentEnv = process.env.NODE_ENV || 'development';
    const allowedLevels = LOG_CONFIG.levels[currentEnv];
    return allowedLevels.includes(level);
  }

  /**
   * Main logging method
   */
  log(level, category, message, context = {}) {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    // Format log entry
    const logEntry = this.formatLogEntry(level, category, message, context);
    
    // Console output with colors
    this.logToConsole(level, category, message, context);
    
    // File output
    const filePath = this.getLogFilePath(category, level);
    this.writeToFile(filePath, logEntry);
  }

  /**
   * Console logging with colors
   */
  logToConsole(level, category, message, context) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    
    switch (level) {
      case LOG_LEVELS.CRITICAL:
        console.error(`🔴 [${timestamp}] [CRITICAL] [${category}] ${message}`, contextStr);
        break;
      case LOG_LEVELS.ERROR:
        console.error(`❌ [${timestamp}] [ERROR] [${category}] ${message}`, contextStr);
        break;
      case LOG_LEVELS.WARNING:
        console.warn(`⚠️ [${timestamp}] [WARNING] [${category}] ${message}`, contextStr);
        break;
      case LOG_LEVELS.INFO:
        console.log(`ℹ️ [${timestamp}] [INFO] [${category}] ${message}`, contextStr);
        break;
      case LOG_LEVELS.DEBUG:
        console.log(`🐛 [${timestamp}] [DEBUG] [${category}] ${message}`, contextStr);
        break;
    }
  }

  /**
   * Critical event logging
   */
  critical(category, message, context = {}) {
    this.log(LOG_LEVELS.CRITICAL, category, message, context);
  }

  /**
   * Error logging
   */
  error(category, message, context = {}) {
    this.log(LOG_LEVELS.ERROR, category, message, context);
  }

  /**
   * Warning logging
   */
  warning(category, message, context = {}) {
    this.log(LOG_LEVELS.WARNING, category, message, context);
  }

  /**
   * Info logging
   */
  info(category, message, context = {}) {
    this.log(LOG_LEVELS.INFO, category, message, context);
  }

  /**
   * Debug logging
   */
  debug(category, message, context = {}) {
    this.log(LOG_LEVELS.DEBUG, category, message, context);
  }

  /**
   * Transaction logging
   */
  transaction(operation, details, context = {}) {
    this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.TRANSACTION, `Transaction: ${operation}`, {
      ...context,
      operation,
      details
    });
  }

  /**
   * Performance logging
   */
  performance(operation, duration, context = {}) {
    this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.PERFORMANCE, `Performance: ${operation}`, {
      ...context,
      operation,
      duration: `${duration}ms`
    });
  }

  /**
   * Daily log rotation
   */
  rotateLogs() {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.currentDate !== today) {
      this.currentDate = today;
      this.cleanupOldLogs();
    }
  }

  /**
   * Cleanup old logs
   */
  cleanupOldLogs() {
    const maxDays = LOG_CONFIG.rotation.maxFiles;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    Object.values(LOG_CONFIG.subDirs).forEach(subDir => {
      const dirPath = path.join(LOG_CONFIG.baseDir, subDir);
      
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            // Compress old files
            if (LOG_CONFIG.rotation.compressOldLogs && !file.endsWith('.gz')) {
              this.compressLogFile(filePath);
            } else {
              // Delete very old files
              fs.unlinkSync(filePath);
            }
          }
        });
      }
    });
  }

  /**
   * Compress log file
   */
  compressLogFile(filePath) {
    try {
      const zlib = require('zlib');
      const gzip = zlib.createGzip();
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(filePath + '.gz');
      
      input.pipe(gzip).pipe(output);
      
      output.on('finish', () => {
        fs.unlinkSync(filePath); // Delete original file
      });
    } catch (error) {
      console.error('Failed to compress log file:', error);
    }
  }
}

// Create singleton instance
const criticalLogger = new CriticalLogger();

// Export methods
export const logCritical = (category, message, context) => criticalLogger.critical(category, message, context);
export const logError = (category, message, context) => criticalLogger.error(category, message, context);
export const logWarning = (category, message, context) => criticalLogger.warning(category, message, context);
export const logInfo = (category, message, context) => criticalLogger.info(category, message, context);
export const logDebug = (category, message, context) => criticalLogger.debug(category, message, context);
export const logTransaction = (operation, details, context) => criticalLogger.transaction(operation, details, context);
export const logPerformance = (operation, duration, context) => criticalLogger.performance(operation, duration, context);

// Export the logger instance for advanced usage
export default criticalLogger;
