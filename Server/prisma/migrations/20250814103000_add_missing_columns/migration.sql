-- Add missing columns to resolve schema drift
-- This migration adds the columns that exist in the database but are missing from the migration history

-- Add created_by column to users table
ALTER TABLE `users` ADD COLUMN `created_by` VARCHAR(36) NULL;
