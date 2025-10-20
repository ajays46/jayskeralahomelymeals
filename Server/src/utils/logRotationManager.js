import cron from 'node-cron';
import { logInfo, logError, logWarning, LOG_CATEGORIES } from './criticalLogger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Daily Log Rotation Manager
 * Features: Automated daily rotation, log cleanup, compression, monitoring
 */

class LogRotationManager {
  constructor() {
    this.isRunning = false;
    this.rotationSchedule = '0 0 * * *'; // Daily at midnight
    this.cleanupSchedule = '0 2 * * *'; // Daily at 2 AM
    this.monitoringSchedule = '0 */6 * * *'; // Every 6 hours
  }

  /**
   * Start the log rotation system
   */
  start() {
    if (this.isRunning) {
      logWarning(LOG_CATEGORIES.SYSTEM, 'Log rotation already running');
      return;
    }

    this.isRunning = true;
    
    // Schedule daily rotation at midnight
    cron.schedule(this.rotationSchedule, () => {
      this.performDailyRotation();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust to your timezone
    });

    // Schedule cleanup at 2 AM
    cron.schedule(this.cleanupSchedule, () => {
      this.performCleanup();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule monitoring every 6 hours
    cron.schedule(this.monitoringSchedule, () => {
      this.performMonitoring();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    logInfo(LOG_CATEGORIES.SYSTEM, 'Log rotation system started', {
      rotationSchedule: this.rotationSchedule,
      cleanupSchedule: this.cleanupSchedule,
      monitoringSchedule: this.monitoringSchedule
    });
  }

  /**
   * Stop the log rotation system
   */
  stop() {
    this.isRunning = false;
    cron.destroy();
    logInfo(LOG_CATEGORIES.SYSTEM, 'Log rotation system stopped');
  }

  /**
   * Perform daily log rotation
   */
  performDailyRotation() {
    try {
      logInfo(LOG_CATEGORIES.SYSTEM, 'Starting daily log rotation');
      
      const today = new Date().toISOString().split('T')[0];
      const logDir = path.join(process.cwd(), 'logs');
      
      // Rotate all log categories
      const categories = ['daily', 'critical', 'errors', 'transactions'];
      
      categories.forEach(category => {
        const categoryDir = path.join(logDir, category);
        
        if (fs.existsSync(categoryDir)) {
          const files = fs.readdirSync(categoryDir);
          
          files.forEach(file => {
            if (file.endsWith('.log') && !file.includes(today)) {
              // This is an old log file, rotate it
              this.rotateLogFile(path.join(categoryDir, file));
            }
          });
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Daily log rotation completed');
    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Daily log rotation failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Rotate individual log file
   */
  rotateLogFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Only rotate if file has content
      if (fileSize > 0) {
        const rotatedPath = filePath.replace('.log', `-${new Date().toISOString().split('T')[0]}.log`);
        
        // Rename current file to rotated name
        fs.renameSync(filePath, rotatedPath);
        
        // Create new empty log file
        fs.writeFileSync(filePath, '');
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Log file rotated', {
          originalFile: path.basename(filePath),
          rotatedFile: path.basename(rotatedPath),
          size: fileSize
        });
      }
    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Failed to rotate log file', {
        filePath,
        error: error.message
      });
    }
  }

  /**
   * Perform log cleanup
   */
  performCleanup() {
    try {
      logInfo(LOG_CATEGORIES.SYSTEM, 'Starting log cleanup');
      
      const logDir = path.join(process.cwd(), 'logs');
      const maxDays = 30; // Keep logs for 30 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDays);
      
      let totalFilesDeleted = 0;
      let totalSpaceFreed = 0;
      
      // Cleanup all subdirectories
      const subDirs = ['daily', 'critical', 'errors', 'transactions', 'archived'];
      
      subDirs.forEach(subDir => {
        const dirPath = path.join(logDir, subDir);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
              const fileSize = stats.size;
              fs.unlinkSync(filePath);
              
              totalFilesDeleted++;
              totalSpaceFreed += fileSize;
              
              logInfo(LOG_CATEGORIES.SYSTEM, 'Old log file deleted', {
                file: file,
                size: fileSize,
                age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
              });
            }
          });
        }
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Log cleanup completed', {
        filesDeleted: totalFilesDeleted,
        spaceFreed: `${(totalSpaceFreed / 1024 / 1024).toFixed(2)} MB`
      });
    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Log cleanup failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Perform log monitoring
   */
  performMonitoring() {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const monitoringData = {
        timestamp: new Date().toISOString(),
        totalLogFiles: 0,
        totalLogSize: 0,
        categories: {}
      };

      // Check each category
      const subDirs = ['daily', 'critical', 'errors', 'transactions'];
      
      subDirs.forEach(subDir => {
        const dirPath = path.join(logDir, subDir);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          let categorySize = 0;
          
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            categorySize += stats.size;
            monitoringData.totalLogFiles++;
          });
          
          monitoringData.categories[subDir] = {
            fileCount: files.length,
            totalSize: categorySize,
            sizeMB: (categorySize / 1024 / 1024).toFixed(2)
          };
          
          monitoringData.totalLogSize += categorySize;
        }
      });

      monitoringData.totalLogSizeMB = (monitoringData.totalLogSize / 1024 / 1024).toFixed(2);

      // Log monitoring data
      logInfo(LOG_CATEGORIES.SYSTEM, 'Log monitoring report', monitoringData);

      // Check for potential issues
      if (monitoringData.totalLogSizeMB > 1000) { // More than 1GB
        logWarning(LOG_CATEGORIES.SYSTEM, 'Log size warning', {
          totalSize: monitoringData.totalLogSizeMB,
          message: 'Total log size exceeds 1GB'
        });
      }

      if (monitoringData.totalLogFiles > 1000) { // More than 1000 files
        logWarning(LOG_CATEGORIES.SYSTEM, 'Log file count warning', {
          totalFiles: monitoringData.totalLogFiles,
          message: 'Total log files exceed 1000'
        });
      }

    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Log monitoring failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Manual rotation trigger
   */
  triggerManualRotation() {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Manual log rotation triggered');
    this.performDailyRotation();
  }

  /**
   * Manual cleanup trigger
   */
  triggerManualCleanup() {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Manual log cleanup triggered');
    this.performCleanup();
  }

  /**
   * Get log statistics
   */
  getLogStatistics() {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const stats = {
        timestamp: new Date().toISOString(),
        totalFiles: 0,
        totalSize: 0,
        categories: {}
      };

      const subDirs = ['daily', 'critical', 'errors', 'transactions'];
      
      subDirs.forEach(subDir => {
        const dirPath = path.join(logDir, subDir);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          let categorySize = 0;
          
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            categorySize += stats.size;
          });
          
          stats.categories[subDir] = {
            fileCount: files.length,
            totalSize: categorySize,
            sizeMB: (categorySize / 1024 / 1024).toFixed(2)
          };
          
          stats.totalFiles += files.length;
          stats.totalSize += categorySize;
        }
      });

      stats.totalSizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);
      
      return stats;
    } catch (error) {
      logError(LOG_CATEGORIES.SYSTEM, 'Failed to get log statistics', {
        error: error.message
      });
      return null;
    }
  }
}

// Create singleton instance
const logRotationManager = new LogRotationManager();

export default logRotationManager;
