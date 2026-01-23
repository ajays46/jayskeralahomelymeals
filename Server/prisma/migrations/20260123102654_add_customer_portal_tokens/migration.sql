-- CreateTable
CREATE TABLE `customer_portal_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `short_token` VARCHAR(20) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME(0) NULL,

    UNIQUE INDEX `customer_portal_tokens_short_token_key`(`short_token`),
    INDEX `idx_short_token`(`short_token`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_portal_tokens` ADD CONSTRAINT `customer_portal_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
