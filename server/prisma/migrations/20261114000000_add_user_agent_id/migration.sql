-- AlterTable
ALTER TABLE `users` ADD COLUMN `agent_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `users_agent_id_idx` ON `users`(`agent_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
