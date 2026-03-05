-- Link MlTrip to MenuItem (one MenuItem per trip for order amount / platform)
ALTER TABLE `ml_trips` ADD COLUMN `menu_item_id` VARCHAR(36) NULL;
CREATE UNIQUE INDEX `ml_trips_menu_item_id_key` ON `ml_trips`(`menu_item_id`);
