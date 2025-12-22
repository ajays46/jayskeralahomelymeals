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
    `route_id` VARCHAR(36) NULL,
    `timestamp` DATETIME(0) NULL,
    `time_from_start_minutes` FLOAT NULL,
    `time_since_departure_minutes` FLOAT NULL,
    `date` DATE NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NULL,
    `journey_phase` VARCHAR(50) NULL,
    `is_at_stop` BOOLEAN NULL DEFAULT false,
    `current_stop_order` INTEGER NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `speed` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_tracking_at_stop`(`is_at_stop`, `route_id`),
    INDEX `idx_tracking_date_session`(`date`, `session`),
    INDEX `idx_tracking_journey_phase`(`journey_phase`, `route_id`),
    INDEX `idx_tracking_route_date`(`route_id`, `date`),
    INDEX `idx_tracking_session`(`session`),
    INDEX `idx_vehicle_tracking_route_time`(`route_id`, `timestamp`),
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
    `route_id` VARCHAR(36) NULL,
    `delivery_id` VARCHAR(36) NULL,
    `start_time` DATETIME(0) NULL,
    `depot_departure_time` DATETIME(0) NULL,
    `date` DATE NOT NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `route_type` ENUM('ai_optimized', 'route_optimization', 'google_maps') NULL DEFAULT 'ai_optimized',
    `is_best_route` BOOLEAN NULL DEFAULT false,
    `route_rank` INTEGER NULL DEFAULT 0,
    `num_drivers` INTEGER NULL DEFAULT 1,
    `stop_order` INTEGER NOT NULL,
    `delivery_name` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `packages` INTEGER NULL,
    `customer_type` VARCHAR(50) NULL DEFAULT 'normal',
    `priority_level` VARCHAR(50) NULL,
    `distance_from_previous` FLOAT NULL,
    `expected_time_from_previous` FLOAT NULL,
    `time_to_travel_from_previous_minutes` FLOAT NULL,
    `cumulative_distance` FLOAT NULL,
    `cumulative_time` FLOAT NULL,
    `cumulative_travel_time_minutes` FLOAT NULL,
    `estimated_completion_hours` FLOAT NULL,
    `within_2_hour_constraint` BOOLEAN NULL DEFAULT true,
    `depot_latitude` FLOAT NULL,
    `depot_longitude` FLOAT NULL,
    `route_comparison_data` JSON NULL,
    `planned_arrival_time` DATETIME(0) NULL,
    `expected_arrival_time` DATETIME(0) NULL,
    `expected_completion_time` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_planned_date_session`(`date`, `session`),
    INDEX `idx_planned_route_delivery_id`(`delivery_id`),
    INDEX `idx_planned_route_id`(`route_id`),
    INDEX `idx_planned_route_main`(`route_id`, `date`, `session`, `route_type`, `is_best_route`, `stop_order`),
    INDEX `idx_planned_route_type`(`route_type`),
    INDEX `idx_planned_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actual_route_stops` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `route_id` VARCHAR(36) NULL,
    `date` DATE NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NULL,
    `start_time` DATETIME(0) NULL,
    `depot_departure_time` DATETIME(0) NULL,
    `planned_stop_id` VARCHAR(36) NULL,
    `stop_order` INTEGER NULL,
    `delivery_name` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `latitude` FLOAT NULL,
    `longitude` FLOAT NULL,
    `packages_delivered` INTEGER NULL,
    `actual_arrival_time` DATETIME(0) NULL,
    `actual_completion_time` DATETIME(0) NULL,
    `time_spent_at_stop_minutes` FLOAT NULL,
    `actual_distance_from_previous` FLOAT NULL,
    `actual_time_from_previous` FLOAT NULL,
    `cumulative_travel_time_minutes` FLOAT NULL,
    `time_to_travel_from_previous_minutes` FLOAT NULL,
    `actual_completion_hours` FLOAT NULL,
    `total_journey_duration_minutes` FLOAT NULL,
    `within_2_hour_constraint` BOOLEAN NULL,
    `performance_score` FLOAT NULL,
    `reward_signal` FLOAT NULL,
    `learning_data` JSON NULL,
    `delivery_status` ENUM('pending', 'arrived', 'delivered', 'missed', 'cancelled') NULL DEFAULT 'pending',
    `delay_reason` TEXT NULL,
    `geo_accuracy` FLOAT NULL,
    `status` ENUM('OnTime', 'Late') NULL,
    `route_type` ENUM('ai_optimized', 'route_optimization', 'google_maps') NULL,

    INDEX `idx_actual_performance`(`performance_score`),
    INDEX `idx_actual_route_id`(`route_id`),
    INDEX `idx_actual_route_main`(`route_id`, `date`, `session`, `route_type`, `stop_order`),
    INDEX `idx_actual_route_type`(`route_type`),
    INDEX `idx_actual_user_id`(`user_id`),
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

-- CreateTable
CREATE TABLE `algorithm_performance` (
    `id` VARCHAR(36) NOT NULL,
    `algorithm_name` VARCHAR(50) NOT NULL,
    `delivery_date` DATE NOT NULL,
    `delivery_session` VARCHAR(20) NULL,
    `num_deliveries` INTEGER NULL,
    `num_drivers` INTEGER NULL,
    `estimated_time_hours` DECIMAL(5, 2) NULL,
    `actual_time_hours` DECIMAL(5, 2) NULL,
    `total_distance_km` DECIMAL(8, 2) NULL,
    `within_constraint` BOOLEAN NULL,
    `algorithm_score` DECIMAL(5, 2) NULL,
    `was_selected` BOOLEAN NULL DEFAULT false,
    `characteristics` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_algorithm_name`(`algorithm_name`),
    INDEX `idx_algorithm_score`(`algorithm_score`),
    INDEX `idx_delivery_date`(`delivery_date`),
    INDEX `idx_was_selected`(`was_selected`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `best_planned_routes` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `route_type` ENUM('ai_optimized', 'route_optimization', 'google_maps') NOT NULL,
    `route_id` VARCHAR(36) NOT NULL,
    `driver_id` VARCHAR(36) NULL,
    `total_distance_km` FLOAT NULL,
    `total_time_minutes` FLOAT NULL,
    `num_stops` INTEGER NULL,
    `num_drivers` INTEGER NULL,
    `within_2_hour_constraint` BOOLEAN NULL DEFAULT false,
    `selection_reason` VARCHAR(255) NULL,
    `comparison_score` FLOAT NULL,
    `ai_score` FLOAT NULL,
    `main_branch_score` FLOAT NULL,
    `compared_with_route_types` TEXT NULL,
    `comparison_details` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_date_session`(`date`, `session`),
    INDEX `idx_route_id`(`route_id`),
    INDEX `idx_route_type`(`route_type`),
    UNIQUE INDEX `unique_date_session_type`(`date`, `session`, `route_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliveries` (
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
CREATE TABLE `delivery_zone_assignments` (
    `id` VARCHAR(36) NOT NULL,
    `delivery_id` VARCHAR(36) NOT NULL,
    `zone_code` VARCHAR(50) NULL,
    `assigned_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_assigned_at`(`assigned_at`),
    INDEX `idx_delivery_id`(`delivery_id`),
    INDEX `idx_zone_code`(`zone_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_zone_polygons` (
    `id` VARCHAR(36) NOT NULL,
    `zone_code` VARCHAR(50) NOT NULL,
    `point_order` INTEGER NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(10, 8) NOT NULL,

    INDEX `idx_zone_code`(`zone_code`),
    INDEX `idx_zone_points`(`zone_code`, `point_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_zones` (
    `id` VARCHAR(36) NOT NULL,
    `zone_code` VARCHAR(50) NOT NULL,
    `zone_name` VARCHAR(255) NOT NULL,
    `zone_type` ENUM('PRIMARY', 'MEDIUM', 'HIGH_DEMAND', 'LOW_PRIORITY') NOT NULL,
    `zone_polygon` geometry NULL,
    `center_latitude` DECIMAL(10, 8) NULL,
    `center_longitude` DECIMAL(10, 8) NULL,
    `radius_km` DECIMAL(8, 2) NULL,
    `priority_weight` DECIMAL(3, 2) NULL DEFAULT 0.50,
    `peak_priority_weight` DECIMAL(3, 2) NULL DEFAULT 0.50,
    `peak_hours_start` TIME(0) NULL,
    `peak_hours_end` TIME(0) NULL,
    `peak_days_of_week` VARCHAR(20) NULL DEFAULT '1,2,3,4,5',
    `normal_speed_kmh` INTEGER NULL DEFAULT 30,
    `peak_speed_kmh` INTEGER NULL DEFAULT 18,
    `description` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `zone_code`(`zone_code`),
    INDEX `idx_is_active`(`is_active`),
    INDEX `idx_zone_code`(`zone_code`),
    INDEX `idx_zone_type`(`zone_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_comparisons` (
    `id` VARCHAR(36) NOT NULL,
    `planned_route_id` VARCHAR(36) NULL,
    `actual_route_id` VARCHAR(36) NULL,
    `session_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `route_id` VARCHAR(36) NULL,
    `planned_distance_km` FLOAT NULL,
    `planned_time_hours` FLOAT NULL,
    `planned_start_time` DATETIME(0) NULL,
    `planned_num_stops` INTEGER NULL,
    `planned_num_drivers` INTEGER NULL,
    `actual_distance_km` FLOAT NULL,
    `actual_time_hours` FLOAT NULL,
    `actual_start_time` DATETIME(0) NULL,
    `actual_num_stops` INTEGER NULL,
    `actual_num_drivers` INTEGER NULL,
    `distance_diff_km` FLOAT NULL,
    `time_diff_hours` FLOAT NULL,
    `efficiency_score` FLOAT NULL,
    `reward_signal` FLOAT NULL,
    `time_of_day` TIME(0) NULL,
    `day_of_week` INTEGER NULL,
    `weather_condition` VARCHAR(100) NULL,
    `traffic_level` ENUM('low', 'medium', 'high') NULL,
    `model_updated` BOOLEAN NULL DEFAULT false,
    `learned_route_saved` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_actual_route`(`actual_route_id`),
    INDEX `idx_date_session`(`date`, `session`),
    INDEX `idx_efficiency`(`efficiency_score`),
    INDEX `idx_planned_route`(`planned_route_id`),
    INDEX `idx_reward`(`reward_signal`),
    INDEX `idx_route_driver`(`route_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_journey_summary` (
    `id` VARCHAR(36) NOT NULL,
    `route_id` VARCHAR(36) NOT NULL,
    `driver_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `route_type` ENUM('ai_optimized', 'route_optimization', 'google_maps') NOT NULL,
    `planned_start_time` DATETIME(0) NULL,
    `planned_depot_departure_time` DATETIME(0) NULL,
    `planned_end_time` DATETIME(0) NULL,
    `planned_total_distance_km` FLOAT NULL,
    `planned_total_time_minutes` FLOAT NULL,
    `planned_num_stops` INTEGER NULL,
    `planned_num_drivers` INTEGER NULL,
    `planned_within_2_hour_constraint` BOOLEAN NULL DEFAULT false,
    `actual_start_time` DATETIME(0) NULL,
    `actual_depot_departure_time` DATETIME(0) NULL,
    `actual_end_time` DATETIME(0) NULL,
    `actual_total_distance_km` FLOAT NULL,
    `actual_total_time_minutes` FLOAT NULL,
    `actual_num_stops` INTEGER NULL,
    `actual_num_drivers` INTEGER NULL,
    `actual_within_2_hour_constraint` BOOLEAN NULL DEFAULT false,
    `time_difference_minutes` FLOAT NULL,
    `distance_difference_km` FLOAT NULL,
    `efficiency_score` FLOAT NULL,
    `is_best_route` BOOLEAN NULL DEFAULT false,
    `average_speed_kmh` FLOAT NULL,
    `total_service_time_minutes` FLOAT NULL,
    `total_travel_time_minutes` FLOAT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_best_route`(`is_best_route`, `date`, `session`),
    INDEX `idx_date_session`(`date`, `session`),
    INDEX `idx_driver_id`(`driver_id`),
    INDEX `idx_route_id`(`route_id`),
    INDEX `idx_route_type`(`route_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_stop_timing_details` (
    `id` VARCHAR(36) NOT NULL,
    `route_id` VARCHAR(36) NOT NULL,
    `planned_stop_id` VARCHAR(36) NULL,
    `actual_stop_id` VARCHAR(36) NULL,
    `stop_order` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `session` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `planned_arrival_time` DATETIME(0) NULL,
    `planned_departure_time` DATETIME(0) NULL,
    `planned_service_time_minutes` FLOAT NULL,
    `planned_travel_time_from_previous_minutes` FLOAT NULL,
    `planned_cumulative_time_minutes` FLOAT NULL,
    `actual_arrival_time` DATETIME(0) NULL,
    `actual_departure_time` DATETIME(0) NULL,
    `actual_service_time_minutes` FLOAT NULL,
    `actual_travel_time_from_previous_minutes` FLOAT NULL,
    `actual_cumulative_time_minutes` FLOAT NULL,
    `arrival_time_difference_minutes` FLOAT NULL,
    `service_time_difference_minutes` FLOAT NULL,
    `travel_time_difference_minutes` FLOAT NULL,
    `delivery_status` ENUM('pending', 'arrived', 'delivered', 'missed', 'cancelled') NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_actual_stop`(`actual_stop_id`),
    INDEX `idx_date_session`(`date`, `session`),
    INDEX `idx_planned_stop`(`planned_stop_id`),
    INDEX `idx_route_id`(`route_id`),
    INDEX `idx_stop_order`(`route_id`, `stop_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `traffic_patterns` (
    `id` VARCHAR(36) NOT NULL,
    `location_name` VARCHAR(255) NULL,
    `location_point` geometry NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(10, 8) NULL,
    `radius_meters` INTEGER NULL DEFAULT 500,
    `start_hour` INTEGER NOT NULL,
    `start_minute` INTEGER NULL DEFAULT 0,
    `end_hour` INTEGER NOT NULL,
    `end_minute` INTEGER NULL DEFAULT 0,
    `days_of_week` VARCHAR(20) NULL DEFAULT '1,2,3,4,5',
    `traffic_multiplier` DECIMAL(3, 2) NULL DEFAULT 1.00,
    `delay_minutes` INTEGER NULL DEFAULT 0,
    `clears_at_hour` INTEGER NULL,
    `clears_at_minute` INTEGER NULL DEFAULT 0,
    `description` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_is_active`(`is_active`),
    INDEX `idx_location`(`latitude`, `longitude`),
    INDEX `idx_time_range`(`start_hour`, `end_hour`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
