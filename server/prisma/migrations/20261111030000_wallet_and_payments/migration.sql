-- Wallet & Finance: deposits, withdrawals, wallets, ledger, payment providers

-- ── Enums ────────────────────────────────────────────────

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEPOSIT_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEPOSIT_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEPOSIT_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_COMPLETED';

CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "PaymentType" AS ENUM ('SEND_MONEY', 'CASH_OUT');
CREATE TYPE "WalletLedgerType" AS ENUM (
  'DEPOSIT_CREDIT',
  'WITHDRAWAL_RESERVE',
  'WITHDRAWAL_RELEASE',
  'WITHDRAWAL_DEBIT',
  'ADJUSTMENT_CREDIT',
  'ADJUSTMENT_DEBIT'
);

-- ── payment_providers ────────────────────────────────────

CREATE TABLE "payment_providers" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(16) NOT NULL,
  "name" TEXT NOT NULL,
  "logo_url" TEXT,
  "brand_color" VARCHAR(16) NOT NULL DEFAULT '#e2136c',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_providers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_providers_code_key" ON "payment_providers"("code");
CREATE INDEX "payment_providers_is_active_idx" ON "payment_providers"("is_active");

-- ── wallets ──────────────────────────────────────────────

CREATE TABLE "wallets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
  "available_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "reserved_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── wallet_transactions (ledger) ─────────────────────────

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "WalletLedgerType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "balance_after" DECIMAL(14,2) NOT NULL,
  "reference_type" VARCHAR(32),
  "reference_id" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx"
  ON "wallet_transactions"("wallet_id", "created_at");
CREATE INDEX "wallet_transactions_user_id_created_at_idx"
  ON "wallet_transactions"("user_id", "created_at");
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx"
  ON "wallet_transactions"("reference_type", "reference_id");
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── deposit_requests ─────────────────────────────────────

CREATE TABLE "deposit_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "payment_type" "PaymentType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
  "agent_number" VARCHAR(32) NOT NULL,
  "transaction_reference" VARCHAR(64) NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "processed_by_id" TEXT,
  "processed_at" TIMESTAMP(3),
  "idempotency_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "deposit_requests_idempotency_key_key" ON "deposit_requests"("idempotency_key");
CREATE INDEX "deposit_requests_user_id_created_at_idx" ON "deposit_requests"("user_id", "created_at");
CREATE INDEX "deposit_requests_status_created_at_idx" ON "deposit_requests"("status", "created_at");
CREATE INDEX "deposit_requests_provider_id_idx" ON "deposit_requests"("provider_id");
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_processed_by_id_fkey"
  FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── withdrawal_requests ──────────────────────────────────

CREATE TABLE "withdrawal_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "receiving_phone" VARCHAR(20) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "payout_reference" VARCHAR(64),
  "processed_by_id" TEXT,
  "processed_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "reservation_tx_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_requests_reservation_tx_id_key"
  ON "withdrawal_requests"("reservation_tx_id");
CREATE INDEX "withdrawal_requests_user_id_created_at_idx"
  ON "withdrawal_requests"("user_id", "created_at");
CREATE INDEX "withdrawal_requests_status_created_at_idx"
  ON "withdrawal_requests"("status", "created_at");
CREATE INDEX "withdrawal_requests_provider_id_idx"
  ON "withdrawal_requests"("provider_id");
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_id_fkey"
  FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Seed payment providers (bKash, Nagad, Rocket, Upay) ──

INSERT INTO "payment_providers" ("id", "code", "name", "brand_color", "sort_order", "updated_at") VALUES
  (gen_random_uuid()::text, 'bkash',  'bKash',  '#e2136c', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'nagad',  'Nagad',  '#ee1c25', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'rocket', 'Rocket', '#8e2d8f', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'upay',   'Upay',   '#f99d1c', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- ── Backfill wallets for existing users ──────────────────

INSERT INTO "wallets" ("id", "user_id", "currency", "available_balance", "reserved_balance", "version", "updated_at")
SELECT gen_random_uuid()::text, u."id", 'BDT', 0, 0, 0, CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "wallets" w WHERE w."user_id" = u."id");
