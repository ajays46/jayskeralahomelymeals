-- Create delivery_images if missing (e.g. shadow DB / migrate reset); then add ANY to delivery_session enum
CREATE TABLE IF NOT EXISTS `delivery_images` (
  `id` VARCHAR(36) NOT NULL,
  `address_id` VARCHAR(36) NOT NULL,
  `content_type` VARCHAR(100) NOT NULL,
  `delivery_date` DATE NOT NULL,
  `delivery_id` VARCHAR(36) NULL,
  `delivery_session` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'ANY') NOT NULL,
  `file_size` BIGINT NOT NULL,
  `file_type` ENUM('image', 'video') NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `is_pre_delivery` BOOLEAN NOT NULL DEFAULT false,
  `presigned_url` VARCHAR(500) NULL,
  `s3_key` VARCHAR(500) NOT NULL,
  `s3_url` VARCHAR(500) NOT NULL,
  `uploaded_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  INDEX `idx_address_date_session`(`address_id`, `delivery_date`, `delivery_session`),
  INDEX `idx_pre_delivery_check`(`address_id`, `delivery_date`, `delivery_session`, `is_pre_delivery`),
  INDEX `idx_address_id`(`address_id`),
  INDEX `idx_delivery_date`(`delivery_date`),
  INDEX `idx_delivery_id`(`delivery_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Add ANY to delivery_session enum (no-op if table was just created with ANY)
ALTER TABLE `delivery_images` MODIFY COLUMN `delivery_session` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'ANY') NOT NULL;
