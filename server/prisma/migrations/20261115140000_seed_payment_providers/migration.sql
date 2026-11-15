-- Restore the payment provider rows the PostgreSQL migrations used to insert
-- (lost when the history was rebuilt for MySQL). Without them no deposit or
-- withdrawal can be created. INSERT IGNORE skips any code that already exists,
-- so this never overwrites or duplicates a provider an admin has edited.
INSERT IGNORE INTO `payment_providers` (`id`, `code`, `name`, `brand_color`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
  (UUID(), 'bkash',  'bKash',  '#e2136c', true, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'nagad',  'Nagad',  '#ee1c25', true, 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'rocket', 'Rocket', '#8e2d8f', true, 3, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'upay',   'Upay',   '#f99d1c', true, 4, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
