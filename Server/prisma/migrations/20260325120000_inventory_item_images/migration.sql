-- inventory_item_images may already exist in some environments; safe for new databases.
CREATE TABLE IF NOT EXISTS `inventory_item_images` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `inventory_item_id` char(36) NOT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_item_images_company_item` (`company_id`, `inventory_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

