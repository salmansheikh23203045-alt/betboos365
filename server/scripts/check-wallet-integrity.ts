/**
 * Read-only wallet integrity check. Changes nothing.
 *
 *   MYSQL_DATABASE_URL=… npx ts-node scripts/check-wallet-integrity.ts
 *
 * For every wallet:
 *   1. reserved_balance must equal the sum of its open (PENDING / APPROVED)
 *      withdrawal requests that hold a reservation;
 *   2. available_balance must equal what the ledger implies:
 *        + deposit, bonus, adjustment credits, reservation releases
 *        − reservations, adjustment debits
 *   3. no balance may be negative.
 *
 * Exit code 1 when any wallet disagrees, so it can gate a deployment.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLUS = new Set(['DEPOSIT_CREDIT', 'BONUS_CREDIT', 'ADJUSTMENT_CREDIT', 'WITHDRAWAL_RELEASE']);
const MINUS = new Set(['WITHDRAWAL_RESERVE', 'ADJUSTMENT_DEBIT']);

async function main() {
  const wallets = await prisma.wallet.findMany({
    select: { id: true, userId: true, availableBalance: true, reservedBalance: true },
  });
  // Looked up separately so a wallet whose user row is missing is reported, not fatal.
  const users = await prisma.user.findMany({
    where: { id: { in: wallets.map((w) => w.userId) } },
    select: { id: true, username: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.username]));
  const open = await prisma.withdrawalRequest.groupBy({
    by: ['userId'],
    where: { status: { in: ['PENDING', 'APPROVED'] }, reservationTxId: { not: null } },
    _sum: { amount: true },
    orderBy: { userId: 'asc' },
  });
  const openBy = new Map(open.map((o) => [o.userId, Number(o._sum?.amount ?? 0)]));
  const ledger = await prisma.walletTransaction.groupBy({
    by: ['walletId', 'type'],
    _sum: { amount: true },
    orderBy: { walletId: 'asc' },
  });
  const implied = new Map<string, number>();
  for (const row of ledger) {
    const amt = Number(row._sum?.amount ?? 0);
    const sign = PLUS.has(row.type) ? 1 : MINUS.has(row.type) ? -1 : 0;
    implied.set(row.walletId, (implied.get(row.walletId) ?? 0) + sign * amt);
  }

  const cents = (n: number) => Math.round(n * 100);
  let bad = 0;
  for (const w of wallets) {
    const available = Number(w.availableBalance);
    const reserved = Number(w.reservedBalance);
    const problems: string[] = [];
    if (!nameOf.has(w.userId)) problems.push('wallet has no user account');
    if (available < 0 || reserved < 0) problems.push('negative balance');
    const expectReserved = openBy.get(w.userId) ?? 0;
    if (cents(reserved) !== cents(expectReserved)) {
      problems.push(`reserved ${reserved.toFixed(2)} but open withdrawals total ${expectReserved.toFixed(2)}`);
    }
    const expectAvailable = implied.get(w.id) ?? 0;
    if (cents(available) !== cents(expectAvailable)) {
      problems.push(`available ${available.toFixed(2)} but ledger implies ${expectAvailable.toFixed(2)}`);
    }
    if (problems.length) {
      bad++;
      console.log(`MISMATCH ${nameOf.get(w.userId) ?? '(missing user)'} (wallet ${w.id}): ${problems.join('; ')}`);
    }
  }
  console.log(`[wallet-integrity] ${wallets.length} wallets checked, ${bad} with mismatches.`);
  if (bad) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('[wallet-integrity] Failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
