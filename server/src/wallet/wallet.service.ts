import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WALLET_CONFIG } from './wallet.config';

export type Tx = Prisma.TransactionClient;

export interface WalletView {
  id: string;
  userId: string;
  currency: string;
  availableBalance: number;
  reservedBalance: number;
  totalBalance: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string, tx?: Tx): Promise<WalletView> {
    const client = tx ?? this.prisma;
    let wallet = await client.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await client.wallet.create({
        data: { userId, currency: WALLET_CONFIG.currency },
      });
    }
    return this.toView(wallet);
  }

  async getBalance(userId: string): Promise<WalletView> {
    return this.getOrCreateWallet(userId);
  }

  async getLedger(userId: string, page = 1, limit = 50) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);
    return {
      data: data.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Lock the wallet row for the rest of the transaction and return its latest
   * committed balances.
   *
   * MySQL's default isolation (REPEATABLE READ) serves plain SELECTs from a
   * snapshot taken at the transaction's first read, so a balance or version
   * read with findUnique() can be stale while another request is changing the
   * same wallet. A locking read (FOR UPDATE) always sees the latest committed
   * row and makes concurrent mutations of one wallet run one after another.
   * Every balance change goes through here.
   */
  private async lock(tx: Tx, userId: string) {
    const rows = await tx.$queryRaw<{ id: string; available: unknown; reserved: unknown }[]>`
      SELECT id, available_balance AS available, reserved_balance AS reserved
      FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
    if (!rows[0]) throw new NotFoundException('Wallet not found');
    return { id: rows[0].id, available: Number(rows[0].available), reserved: Number(rows[0].reserved) };
  }

  /** Re-read after this transaction's own write (always visible to it). */
  private after(tx: Tx, walletId: string) {
    return tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
  }

  private ledger(
    tx: Tx,
    walletId: string,
    userId: string,
    type: WalletLedgerType,
    amount: Prisma.Decimal | number,
    balanceAfter: Prisma.Decimal,
    ref?: { type: string; id: string; description?: string },
  ) {
    return tx.walletTransaction.create({
      data: {
        walletId,
        userId,
        type,
        amount: amount as Prisma.Decimal,
        balanceAfter,
        referenceType: ref?.type,
        referenceId: ref?.id,
        description: ref?.description,
      },
    });
  }

  /**
   * Credit available balance and write a ledger entry. MUST be called inside
   * an existing Prisma transaction so the mutation and the ledger write are
   * atomic. Returns the new balance.
   */
  async credit(
    tx: Tx,
    userId: string,
    amount: Prisma.Decimal | number,
    type: WalletLedgerType,
    ref?: { type: string; id: string; description?: string },
  ): Promise<Prisma.Decimal> {
    const w = await this.lock(tx, userId);
    await tx.wallet.update({
      where: { id: w.id },
      data: { availableBalance: { increment: amount as Prisma.Decimal }, version: { increment: 1 } },
    });
    const updated = await this.after(tx, w.id);
    await this.ledger(tx, w.id, userId, type, amount, updated.availableBalance, ref);
    return updated.availableBalance;
  }

  /**
   * Move funds from available -> reserved (withdrawal pending). Fails if
   * the wallet has insufficient available balance. Writes a ledger entry
   * and returns its id so the caller can bind it to the withdrawal request.
   */
  async reserve(
    tx: Tx,
    userId: string,
    amount: number,
    ref: { type: string; id: string; description?: string },
  ): Promise<{ newAvailable: number; ledgerId: string }> {
    const w = await this.lock(tx, userId);
    if (w.available < amount) throw new InsufficientBalanceError();
    // Conditional as well as locked: the balance can never go below zero.
    const moved = await tx.wallet.updateMany({
      where: { id: w.id, availableBalance: { gte: amount } },
      data: {
        availableBalance: { decrement: amount },
        reservedBalance: { increment: amount },
        version: { increment: 1 },
      },
    });
    if (moved.count !== 1) throw new InsufficientBalanceError();
    const updated = await this.after(tx, w.id);
    const entry = await this.ledger(tx, w.id, userId, WalletLedgerType.WITHDRAWAL_RESERVE, amount, updated.availableBalance, ref);
    return { newAvailable: Number(updated.availableBalance), ledgerId: entry.id };
  }

  /**
   * Release a reservation back to available (admin rejected withdrawal).
   */
  async releaseReservation(
    tx: Tx,
    userId: string,
    amount: number,
    ref: { type: string; id: string; description?: string },
  ): Promise<number> {
    const w = await this.lock(tx, userId);
    const moved = await tx.wallet.updateMany({
      where: { id: w.id, reservedBalance: { gte: amount } },
      data: {
        availableBalance: { increment: amount },
        reservedBalance: { decrement: amount },
        version: { increment: 1 },
      },
    });
    if (moved.count !== 1) {
      this.logger.error(`Reserved balance below release amount for wallet ${w.id}`);
      throw new ReservationMismatchError();
    }
    const updated = await this.after(tx, w.id);
    await this.ledger(tx, w.id, userId, WalletLedgerType.WITHDRAWAL_RELEASE, amount, updated.availableBalance, ref);
    return Number(updated.availableBalance);
  }

  /**
   * Debit the reservation (admin completed withdrawal). Reduces reserved,
   * leaving available unchanged. Refuses to pay out money that is not held.
   */
  async debitReservation(
    tx: Tx,
    userId: string,
    amount: number,
    ref: { type: string; id: string; description?: string },
  ): Promise<void> {
    const w = await this.lock(tx, userId);
    const moved = await tx.wallet.updateMany({
      where: { id: w.id, reservedBalance: { gte: amount } },
      data: { reservedBalance: { decrement: amount }, version: { increment: 1 } },
    });
    if (moved.count !== 1) {
      this.logger.error(`Reserved balance below payout amount for wallet ${w.id}`);
      throw new ReservationMismatchError();
    }
    const updated = await this.after(tx, w.id);
    await this.ledger(tx, w.id, userId, WalletLedgerType.WITHDRAWAL_DEBIT, amount, updated.availableBalance, ref);
  }

  private toView(w: {
    id: string;
    userId: string;
    currency: string;
    availableBalance: Prisma.Decimal;
    reservedBalance: Prisma.Decimal;
  }): WalletView {
    const available = Number(w.availableBalance);
    const reserved = Number(w.reservedBalance);
    return {
      id: w.id,
      userId: w.userId,
      currency: w.currency,
      availableBalance: available,
      reservedBalance: reserved,
      totalBalance: available + reserved,
    };
  }
}

/**
 * The reserved balance does not cover a release or payout: the books and the
 * request disagree. The operation is refused rather than letting the reserved
 * balance go negative.
 */
export class ReservationMismatchError extends ConflictException {
  constructor() {
    super('The reserved balance does not cover this withdrawal. Nothing was changed; please contact a Super Admin.');
  }
}

// Sentinel error — caller translates to HTTP 400.
export class InsufficientBalanceError extends Error {
  constructor() {
    super('Insufficient balance');
    this.name = 'InsufficientBalanceError';
  }
}
