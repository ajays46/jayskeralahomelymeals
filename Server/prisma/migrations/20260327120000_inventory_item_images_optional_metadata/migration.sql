-- Adds optional metadata columns when the table was created from the slim migration.
-- If your database already has these columns, mark this migration as applied without running it.
ALTER TABLE `inventory_item_images`
  ADD COLUMN `s3_key` varchar(500) NULL,
  ADD COLUMN `s3_url` varchar(500) NULL,
  ADD COLUMN `presigned_url` varchar(500) NULL,
  ADD COLUMN `filename` varchar(255) NULL,
  ADD COLUMN `sort_order` int NULL,
  ADD COLUMN `is_primary` tinyint(1) NULL;
