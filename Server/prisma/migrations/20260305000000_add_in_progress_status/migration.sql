-- Add In_Progress to OrderStatus enum (orders and delivery_items)
-- Run this migration after updating schema.prisma OrderStatus enum.

ALTER TABLE `orders` MODIFY `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed', 'CUSTOMER_UNAVAILABLE', 'In_Progress') NOT NULL DEFAULT 'Pending';

ALTER TABLE `delivery_items` MODIFY `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed', 'CUSTOMER_UNAVAILABLE', 'In_Progress') NOT NULL DEFAULT 'Pending';
