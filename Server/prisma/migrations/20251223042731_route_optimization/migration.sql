/*
  Warnings:

  - The values [Breakfast,Lunch,Dinner] on the enum `delivery_items_delivery_time_slot` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `delivery_items` MODIFY `delivery_time_slot` ENUM('BREAKFAST', 'LUNCH', 'DINNER') NOT NULL;
