/*
  Warnings:

  - You are about to drop the column `day_of_week` on the `menus` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menus` DROP COLUMN `day_of_week`;

-- CreateTable
CREATE TABLE `menu_item_prices` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `total_price` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_categories` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `menu_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deliveries` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Date` DATE NOT NULL,
    `Delivery_Name` VARCHAR(100) NOT NULL,
    `Location` VARCHAR(150) NULL,
    `Packages` INTEGER NULL DEFAULT 0,
    `Final_Latitude` DECIMAL(10, 6) NULL,
    `Final_Longitude` DECIMAL(10, 6) NULL,
    `Coords` VARCHAR(100) NULL,
    `Distance_Diff_km` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
