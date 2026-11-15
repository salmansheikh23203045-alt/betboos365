-- Additive only: one new column with a default, so existing rows stay valid
-- and no data is rewritten. Existing accounts get `false` (no forced change).
ALTER TABLE `users` ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT false;
