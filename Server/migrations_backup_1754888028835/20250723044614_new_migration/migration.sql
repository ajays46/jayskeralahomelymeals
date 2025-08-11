-- AlterTable
ALTER TABLE `menu_items` ADD COLUMN `food_type` ENUM('VEG', 'NON_VEG') NOT NULL DEFAULT 'VEG';

-- CreateTable
CREATE TABLE `customer_subscription` (
    `customer_id` INTEGER NOT NULL,
    `subscription_type` INTEGER NOT NULL,
    `morning_status` ENUM('YES', 'NO') NOT NULL,
    `lunch_status` ENUM('YES', 'NO') NOT NULL,
    `dinner_status` ENUM('YES', 'NO') NOT NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
