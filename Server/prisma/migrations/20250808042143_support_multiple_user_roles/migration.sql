/*
  Warnings:

  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[user_id,name]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- Step 1: Add id column as optional first
ALTER TABLE `user_roles` ADD COLUMN `id` VARCHAR(36) NULL;

-- Step 2: Populate id column with UUID values for existing records
UPDATE `user_roles` SET `id` = UUID() WHERE `id` IS NULL;

-- Step 3: Make id column required
ALTER TABLE `user_roles` MODIFY COLUMN `id` VARCHAR(36) NOT NULL;

-- Step 4: Drop the old primary key and add the new one
ALTER TABLE `user_roles` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`id`);

-- Step 5: Add unique constraint for user_id and name combination
CREATE UNIQUE INDEX `user_roles_user_id_name_key` ON `user_roles`(`user_id`, `name`);
