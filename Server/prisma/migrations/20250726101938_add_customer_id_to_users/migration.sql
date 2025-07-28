/*
  Warnings:

  - A unique constraint covering the columns `[customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `menu_items` MODIFY `product_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `customer_id` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_customer_id_key` ON `users`(`customer_id`);
