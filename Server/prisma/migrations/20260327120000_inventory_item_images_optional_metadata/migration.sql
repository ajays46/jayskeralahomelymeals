-- Adds optional metadata columns when the table was created from the slim migration.
-- Safe if columns already exist (e.g. full table from later migration or db push).

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 's3_key');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `s3_key` varchar(500) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 's3_url');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `s3_url` varchar(500) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 'presigned_url');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `presigned_url` varchar(500) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 'filename');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `filename` varchar(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 'sort_order');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `sort_order` int NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_images' AND COLUMN_NAME = 'is_primary');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `inventory_item_images` ADD COLUMN `is_primary` tinyint(1) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
