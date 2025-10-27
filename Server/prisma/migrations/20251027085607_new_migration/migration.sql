-- CreateTable
CREATE TABLE `auths` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(255) NULL,
    `api_key` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auths_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `auth_id` VARCHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'BLOCKED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `company_id` VARCHAR(36) NULL,

    UNIQUE INDEX `users_auth_id_key`(`auth_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `housename` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `pincode` INTEGER NOT NULL,
    `geo_location` VARCHAR(255) NULL,
    `address_type` ENUM('HOME', 'OFFICE', 'OTHER') NOT NULL DEFAULT 'HOME',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `google_maps_url` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` VARCHAR(36) NOT NULL,
    `name` ENUM('ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'CEO', 'CFO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `id` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `user_roles_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `image_url` TEXT NULL,
    `code` VARCHAR(255) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_prices` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `price` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_quantities` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `menu_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `product_id` VARCHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_item_prices` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `total_price` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_categories` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `menu_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` VARCHAR(36) NOT NULL,
    `company_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `product_category_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deliveries` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Date` DATE NOT NULL,
    `Delivery_Name` VARCHAR(100) NOT NULL,
    `Location` VARCHAR(150) NULL,
    `Packages` INTEGER NULL DEFAULT 0,
    `Final_Latitude` DECIMAL(10, 6) NULL,
    `Final_Longitude` DECIMAL(10, 6) NULL,
    `Coords` VARCHAR(100) NULL,
    `Distance_Diff_km` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `linked_recurring_order_id` VARCHAR(36) NULL,
    `order_date` DATE NOT NULL,
    `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed') NOT NULL DEFAULT 'Pending',
    `order_times` VARCHAR(191) NOT NULL,
    `total_price` INTEGER NOT NULL,
    `delivery_address_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `delivery_date` DATE NOT NULL,
    `delivery_time_slot` ENUM('Breakfast', 'Lunch', 'Dinner') NOT NULL,
    `address_id` VARCHAR(36) NOT NULL,
    `status` ENUM('Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `instagram_handle` VARCHAR(255) NULL,
    `whatsapp_number` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phone_numbers` (
    `id` VARCHAR(36) NOT NULL,
    `contact_id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `number` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `external_receipt_url` VARCHAR(500) NULL,

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

-- CreateTable
CREATE TABLE `delivery_executive_profile` (
    `user_id` VARCHAR(36) NOT NULL,
    `license_number` VARCHAR(50) NULL,
    `license_expiry_date` DATE NULL,
    `joined_date` DATE NULL,
    `rating` FLOAT NULL,
    `total_routes` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NULL DEFAULT 'ACTIVE',
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

-- CreateTable
CREATE TABLE `manual_review_log` (
    `id` VARCHAR(36) NOT NULL,
    `table_name` VARCHAR(255) NULL,
    `record_id` VARCHAR(36) NULL,
    `issue_type` VARCHAR(255) NULL,
    `issue_description` TEXT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `status` VARCHAR(100) NULL,
    `reviewed_by` VARCHAR(36) NULL,
    `reviewed_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_executives` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `location` TEXT NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `delivery_executives_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
