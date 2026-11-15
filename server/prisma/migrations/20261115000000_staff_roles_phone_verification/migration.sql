-- Staff roles, withdrawal assignment and phone verification.
-- Additive only: new nullable columns, two new audit enum values, one index, three FKs.
-- No existing column, row or table is dropped or rewritten.

-- AlterTable
ALTER TABLE `audit_logs` MODIFY `action` ENUM('LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'GAME_LAUNCH', 'PROMOTION_CLAIM', 'ADMIN_ACTION', 'SUPPORT_TICKET', 'SETTINGS_CHANGE', 'DEPOSIT_SUBMITTED', 'DEPOSIT_APPROVED', 'DEPOSIT_REJECTED', 'WITHDRAWAL_SUBMITTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_ASSIGNED', 'PHONE_VERIFIED') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `permissions` JSON NULL,
    ADD COLUMN `phone_verified_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `withdrawal_requests` ADD COLUMN `assigned_agent_id` VARCHAR(191) NULL,
    ADD COLUMN `assigned_at` DATETIME(3) NULL,
    ADD COLUMN `assigned_by_id` VARCHAR(191) NULL,
    ADD COLUMN `completed_by_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `withdrawal_requests_assigned_agent_id_status_idx` ON `withdrawal_requests`(`assigned_agent_id`, `status`);

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_assigned_agent_id_fkey` FOREIGN KEY (`assigned_agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_completed_by_id_fkey` FOREIGN KEY (`completed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
