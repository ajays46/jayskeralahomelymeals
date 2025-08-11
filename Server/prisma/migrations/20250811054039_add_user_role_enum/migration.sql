/*
  Warnings:

  - You are about to alter the column `name` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `user_roles` MODIFY `name` ENUM('ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE') NOT NULL;
