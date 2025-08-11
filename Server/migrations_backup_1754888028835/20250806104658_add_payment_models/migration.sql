-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `payment_method` ENUM('UPI', 'CreditCard', 'DebitCard', 'NetBanking') NOT NULL,
    `payment_status` ENUM('Pending', 'Confirmed', 'Failed') NOT NULL DEFAULT 'Pending',
    `payment_amount` INTEGER NOT NULL,
    `payment_date` DATETIME(3) NULL,
    `receipt_url` VARCHAR(500) NULL,
    `uploaded_receipt_type` ENUM('Image', 'PDF') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_receipts` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `payment_id` VARCHAR(36) NOT NULL,
    `receipt_image_url` VARCHAR(500) NOT NULL,
    `receipt` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
