-- Telegram community bonus.
-- Additive only: one value appended to the wallet ledger enum (existing rows
-- keep their values) and three new tables. Nothing is dropped or rewritten.

-- AlterTable
ALTER TABLE `wallet_transactions` MODIFY `type` ENUM('DEPOSIT_CREDIT', 'WITHDRAWAL_RESERVE', 'WITHDRAWAL_RELEASE', 'WITHDRAWAL_DEBIT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT', 'BONUS_CREDIT') NOT NULL;

-- CreateTable
CREATE TABLE `telegram_links` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `telegram_user_id` VARCHAR(32) NOT NULL,
    `telegram_username` VARCHAR(64) NULL,
    `linked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `telegram_links_user_id_key`(`user_id`),
    UNIQUE INDEX `telegram_links_telegram_user_id_key`(`telegram_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telegram_link_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `code_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `telegram_link_codes_code_hash_key`(`code_hash`),
    INDEX `telegram_link_codes_user_id_idx`(`user_id`),
    INDEX `telegram_link_codes_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bonus_claims` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('TELEGRAM_JOIN') NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'BDT',
    `telegram_user_id` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bonus_claims_created_at_idx`(`created_at`),
    UNIQUE INDEX `bonus_claims_user_id_type_key`(`user_id`, `type`),
    UNIQUE INDEX `bonus_claims_type_telegram_user_id_key`(`type`, `telegram_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `telegram_links` ADD CONSTRAINT `telegram_links_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telegram_link_codes` ADD CONSTRAINT `telegram_link_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bonus_claims` ADD CONSTRAINT `bonus_claims_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

