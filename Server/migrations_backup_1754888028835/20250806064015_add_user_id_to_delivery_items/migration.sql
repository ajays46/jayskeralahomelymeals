/*
  Warnings:

  - Added the required column `user_id` to the `delivery_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `delivery_items` ADD COLUMN `user_id` VARCHAR(36) NOT NULL;
