-- CreateTable: ML trip addresses (pickup/delivery for MaXHub Logistics trips)
-- Idempotent: skip if table already exists
CREATE TABLE IF NOT EXISTS `ml_trip_addresses` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `housename` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `pincode` INTEGER NOT NULL,
    `geo_location` VARCHAR(255) NULL,
    `google_maps_url` VARCHAR(500) NULL,
    `address_type` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ML trips (delivery partner trips: platform, order amount, partner payment, addresses)
CREATE TABLE IF NOT EXISTS `ml_trips` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `platform` VARCHAR(50) NOT NULL,
    `order_amount` DECIMAL(10, 2) NOT NULL,
    `partner_payment` DECIMAL(10, 2) NOT NULL,
    `pickup_address_id` VARCHAR(36) NULL,
    `delivery_address_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
