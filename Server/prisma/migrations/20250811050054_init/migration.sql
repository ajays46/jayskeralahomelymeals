-- CreateTable
CREATE TABLE `delivery_executive_profile` (
    `user_id` VARCHAR(36) NOT NULL,
    `license_number` VARCHAR(50) NULL,
    `license_expiry_date` DATE NULL,
    `joined_date` DATE NULL,
    `rating` FLOAT NULL,
    `total_routes` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `special_days` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATE NULL,
    `description` TEXT NULL,
    `school` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `traffic_weather_log` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `date` DATE NULL,
    `weather` VARCHAR(100) NULL,
    `traffic_level` ENUM('Low', 'Medium', 'High') NULL,
    `delay_minutes` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_service_log` (
    `id` VARCHAR(36) NOT NULL,
    `vehicle_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `service_date` DATE NULL,
    `service_details` TEXT NULL,
    `cost` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_tracking_log` (
    `id` VARCHAR(36) NOT NULL,
    `vehicle_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `timestamp` DATETIME(0) NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `speed` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `registration_number` VARCHAR(50) NULL,
    `model` VARCHAR(100) NULL,
    `purchase_date` DATE NULL,
    `insurance_expiry` DATE NULL,
    `puc_expiry` DATE NULL,
    `fitness_expiry` DATE NULL,
    `road_tax_expiry` DATE NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_log` (
    `id` VARCHAR(36) NOT NULL,
    `vehicle_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NULL,
    `refuel_date` DATE NULL,
    `litres` FLOAT NULL,
    `cost` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planned_route_stops` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `date` DATE NULL,
    `session` ENUM('Breakfast', 'Lunch', 'Dinner') NULL,
    `stop_order` INTEGER NULL,
    `delivery_name` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `packages` INTEGER NULL,
    `customer_type` VARCHAR(50) NULL DEFAULT 'normal',
    `priority_level` VARCHAR(50) NULL,
    `distance_from_previous` FLOAT NULL,
    `expected_time_from_previous` FLOAT NULL,
    `cumulative_distance` FLOAT NULL,
    `cumulative_time` FLOAT NULL,
    `planned_arrival_time` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actual_route_stops` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `planned_stop_id` VARCHAR(36) NULL,
    `stop_order` INTEGER NULL,
    `delivery_name` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `packages_delivered` INTEGER NULL,
    `actual_arrival_time` DATETIME(0) NULL,
    `actual_distance_from_previous` FLOAT NULL,
    `actual_time_from_previous` FLOAT NULL,
    `delivery_status` ENUM('Delivered', 'Missed', 'Skipped') NULL,
    `delay_reason` TEXT NULL,
    `geo_accuracy` FLOAT NULL,
    `status` ENUM('OnTime', 'Late') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_subscriptions` (
    `customer_id` INTEGER NOT NULL,
    `subscription_type` INTEGER NOT NULL,
    `morning_status` ENUM('YES', 'NO') NOT NULL,
    `lunch_status` ENUM('YES', 'NO') NOT NULL,
    `dinner_status` ENUM('YES', 'NO') NOT NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
