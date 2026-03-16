-- DropForeignKey
ALTER TABLE `customer_portal_tokens` DROP FOREIGN KEY `customer_portal_tokens_user_id_fkey`;

-- AlterTable
ALTER TABLE `customer_portal_tokens` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user_roles` MODIFY `name` ENUM('ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'DELIVERY_PARTNER', 'PARTNER_MANAGER', 'CEO', 'CFO') NOT NULL;

-- CreateTable
CREATE TABLE `driver_availability` (
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
