/*
  Warnings:

  - Added the required column `day_of_week` to the `menus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `menus` ADD COLUMN `day_of_week` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL;
