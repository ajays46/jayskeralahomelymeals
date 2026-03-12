-- Add status enum to ml_trips (PENDING when created, can be set to DELIVERED)
ALTER TABLE `ml_trips` ADD COLUMN `status` ENUM('PENDING', 'DELIVERED') NOT NULL DEFAULT 'PENDING';
