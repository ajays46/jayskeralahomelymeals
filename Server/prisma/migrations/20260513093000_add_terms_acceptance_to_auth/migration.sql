-- AlterTable: add terms acceptance proof fields to auths
-- Idempotent: skip each column if it already exists
SET @terms_accepted_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'auths'
    AND COLUMN_NAME = 'terms_accepted'
);
SET @sql_terms_accepted = IF(
  @terms_accepted_exists = 0,
  'ALTER TABLE `auths` ADD COLUMN `terms_accepted` BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt FROM @sql_terms_accepted;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @terms_accepted_at_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'auths'
    AND COLUMN_NAME = 'terms_accepted_at'
);
SET @sql_terms_accepted_at = IF(
  @terms_accepted_at_exists = 0,
  'ALTER TABLE `auths` ADD COLUMN `terms_accepted_at` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_terms_accepted_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
