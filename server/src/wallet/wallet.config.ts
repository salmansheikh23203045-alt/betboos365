// Operational limits for deposit and withdrawal flows.
// Sourced from env vars so ops can retune without a redeploy; values are
// in the wallet's currency (BDT). Falls back to sensible casino defaults.

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const WALLET_CONFIG = {
  currency: process.env.WALLET_CURRENCY ?? 'BDT',
  agentNumber: process.env.DEPOSIT_AGENT_NUMBER ?? '01956869852',
  deposit: {
    min: readNumber('DEPOSIT_MIN', 100),
    max: readNumber('DEPOSIT_MAX', 100_000),
  },
  withdrawal: {
    min: readNumber('WITHDRAWAL_MIN', 500),
    max: readNumber('WITHDRAWAL_MAX', 50_000),
  },
} as const;
