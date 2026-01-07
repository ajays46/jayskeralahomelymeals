-- AlterTable
ALTER TABLE `orders` MODIFY `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed', 'CUSTOMER_UNAVAILABLE') NOT NULL DEFAULT 'Pending';

