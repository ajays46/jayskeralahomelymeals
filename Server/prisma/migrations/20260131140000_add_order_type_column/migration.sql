-- Add order_type column (stores 'SAMPLE' for sample delivery, null for normal)
ALTER TABLE `orders` ADD COLUMN `order_type` VARCHAR(50) NULL;

-- Migrate existing is_sample data: 1/true -> 'SAMPLE'
UPDATE `orders` SET `order_type` = 'SAMPLE' WHERE `is_sample` = 1;

-- Remove is_sample column
ALTER TABLE `orders` DROP COLUMN `is_sample`;
