/*
  Warnings:

  - You are about to drop the column `product_name` on the `menu_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menu_items` DROP COLUMN `product_name`,
    ADD COLUMN `product_id` VARCHAR(36) NULL;
