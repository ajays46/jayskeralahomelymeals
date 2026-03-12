-- Add platform_type to menu_items for ML trip platform (Swiggy, Amazon, Flipkart)
-- Idempotent: skip if column already exists (e.g. from manual add or previous partial apply)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'platform_type');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `menu_items` ADD COLUMN `platform_type` VARCHAR(50) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
