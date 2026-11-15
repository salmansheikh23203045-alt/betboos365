-- Optional number the player sent a deposit from (any mobile number).
-- Additive only: one nullable column; existing rows are untouched.
ALTER TABLE `deposit_requests` ADD COLUMN `sender_phone` VARCHAR(20) NULL;
