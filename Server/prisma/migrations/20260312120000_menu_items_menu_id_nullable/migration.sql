-- Ensure menu_items.menu_id is nullable for ML company (menu items without a menu).
-- Idempotent: only run if menu_id is currently NOT NULL.
SET @menu_id_nullable = (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'menu_id');
SET @sql = IF(@menu_id_nullable = 'NO',
  'ALTER TABLE `menu_items` MODIFY COLUMN `menu_id` VARCHAR(36) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
