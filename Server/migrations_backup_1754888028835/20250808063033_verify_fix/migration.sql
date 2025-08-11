/*
  Warnings:

  - You are about to alter the column `name` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE `user_roles` MODIFY `name` VARCHAR(255) NOT NULL;
