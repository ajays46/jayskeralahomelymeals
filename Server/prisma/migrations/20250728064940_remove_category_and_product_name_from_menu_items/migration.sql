/*
  Warnings:

  - You are about to drop the column `category_id` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `menu_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menu_items` DROP COLUMN `category_id`,
    DROP COLUMN `product_name`;
