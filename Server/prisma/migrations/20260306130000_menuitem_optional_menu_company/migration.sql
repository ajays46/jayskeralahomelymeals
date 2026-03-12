-- Allow menu items without a menu (for ML company): optional menu_id, add company_id
-- Idempotent: skip if column already exists or menu_id already nullable
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'company_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `menu_items` ADD COLUMN `company_id` VARCHAR(36) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @menu_id_nullable = (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'menu_id');
SET @sql2 = IF(@menu_id_nullable = 'NO',
  'ALTER TABLE `menu_items` MODIFY COLUMN `menu_id` VARCHAR(36) NULL',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
