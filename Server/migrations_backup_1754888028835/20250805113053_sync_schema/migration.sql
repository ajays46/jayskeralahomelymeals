/*
  Warnings:

  - You are about to drop the column `delivery_schedule` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `delivery_schedule`;

-- DropTable
DROP TABLE `order_items`;

-- CreateTable
CREATE TABLE `delivery_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `delivery_date` DATE NOT NULL,
    `delivery_time_slot` ENUM('Breakfast', 'Lunch', 'Dinner') NOT NULL,
    `address_id` VARCHAR(36) NOT NULL,
    `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
