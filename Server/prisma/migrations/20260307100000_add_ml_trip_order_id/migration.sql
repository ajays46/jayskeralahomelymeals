-- Add optional order_id to ml_trips (e.g. platform order ID)
ALTER TABLE `ml_trips` ADD COLUMN `order_id` VARCHAR(255) NULL;
