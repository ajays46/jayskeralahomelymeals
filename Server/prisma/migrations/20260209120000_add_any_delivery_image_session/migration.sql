-- AlterTable: Add ANY to delivery_session enum on delivery_images for flexible (no specific session) deliveries
ALTER TABLE `delivery_images` MODIFY COLUMN `delivery_session` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'ANY') NOT NULL;
