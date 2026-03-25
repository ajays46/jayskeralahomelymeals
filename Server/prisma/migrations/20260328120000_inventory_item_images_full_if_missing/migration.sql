-- Ensures the table exists with the full column set (fixes "table does not exist" when earlier steps were skipped or DB was reset).
CREATE TABLE IF NOT EXISTS `inventory_item_images` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `inventory_item_id` char(36) NOT NULL,
  `s3_key` varchar(500) DEFAULT NULL,
  `s3_url` varchar(500) DEFAULT NULL,
  `presigned_url` varchar(500) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT NULL,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_item_images_company_item` (`company_id`, `inventory_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
