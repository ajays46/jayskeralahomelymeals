-- Link MlTrip to MenuItem (one MenuItem per trip for order amount / platform)
-- Idempotent: skip if column/index already exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ml_trips' AND COLUMN_NAME = 'menu_item_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `ml_trips` ADD COLUMN `menu_item_id` VARCHAR(36) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ml_trips' AND INDEX_NAME = 'ml_trips_menu_item_id_key');
SET @sql2 = IF(@idx_exists = 0,
  'CREATE UNIQUE INDEX `ml_trips_menu_item_id_key` ON `ml_trips`(`menu_item_id`)',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
