-- Add platform_type to menu_items for ML trip platform (Swiggy, Amazon, Flipkart)
ALTER TABLE `menu_items` ADD COLUMN `platform_type` VARCHAR(50) NULL;
