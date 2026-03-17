-- DropForeignKey (only if it exists, so migration can be re-run)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_portal_tokens' AND CONSTRAINT_NAME = 'customer_portal_tokens_user_id_fkey');
SET @sql = IF(@fk_exists > 0, 'ALTER TABLE `customer_portal_tokens` DROP FOREIGN KEY `customer_portal_tokens_user_id_fkey`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable
ALTER TABLE `customer_portal_tokens` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user_roles` MODIFY `name` ENUM('ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'DELIVERY_PARTNER', 'PARTNER_MANAGER', 'CEO', 'CFO') NOT NULL;

-- CreateTable (IF NOT EXISTS so migration can be re-run if table was created manually or by another migration)
CREATE TABLE IF NOT EXISTS `driver_availability` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `platform` VARCHAR(100) NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `route_id` VARCHAR(36) NULL,
    `depot_latitude` DECIMAL(10, 7) NULL,
    `depot_longitude` DECIMAL(10, 7) NULL,
    `available_at` TIMESTAMP(0) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `driver_availability_user_id_company_id_key`(`user_id`, `company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
