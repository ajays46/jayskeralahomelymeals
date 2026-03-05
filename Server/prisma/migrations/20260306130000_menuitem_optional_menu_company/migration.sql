-- Allow menu items without a menu (for ML company): optional menu_id, add company_id
ALTER TABLE `menu_items` ADD COLUMN `company_id` VARCHAR(36) NULL;
ALTER TABLE `menu_items` MODIFY COLUMN `menu_id` VARCHAR(36) NULL;
