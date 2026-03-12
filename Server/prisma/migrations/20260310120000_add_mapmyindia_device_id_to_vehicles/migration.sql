-- AlterTable: add MapMyIndia device id for vehicle tracking
-- Idempotent: skip if column already exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'mapmyindia_device_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `vehicles` ADD COLUMN `mapmyindia_device_id` VARCHAR(100) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
