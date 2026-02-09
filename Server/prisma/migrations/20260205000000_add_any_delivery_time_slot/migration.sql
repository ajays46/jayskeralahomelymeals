-- AlterTable: Add ANY to delivery_time_slot enum for flexible (no specific session) delivery
ALTER TABLE `delivery_items` MODIFY `delivery_time_slot` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'ANY') NOT NULL;
