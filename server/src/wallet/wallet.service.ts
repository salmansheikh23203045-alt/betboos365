import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount as any },
        version: { increment: 1 },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type,
        amount: amount as any,
        balanceAfter: updated.availableBalance,
        referenceType: ref?.type,
        referenceId: ref?.id,
        description: ref?.description,
      },
    });
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
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.availableBalance) < amount) {
      throw new InsufficientBalanceError();
    }
    const updated = await tx.wallet.update({
      where: {
        id: wallet.id,
        version: wallet.version, // optimistic lock
      },
      data: {
        availableBalance: { decrement: amount },
        reservedBalance: { increment: amount },
        version: { increment: 1 },
      },
    });
    const entry = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: WalletLedgerType.WITHDRAWAL_RESERVE,
        amount,
        balanceAfter: updated.availableBalance,
        referenceType: ref.type,
        referenceId: ref.id,
        description: ref.description,
      },
    });
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
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        reservedBalance: { decrement: amount },
        version: { increment: 1 },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: WalletLedgerType.WITHDRAWAL_RELEASE,
        amount,
        balanceAfter: updated.availableBalance,
        referenceType: ref.type,
        referenceId: ref.id,
        description: ref.description,
      },
    });
    return Number(updated.availableBalance);
  }

  /**
   * Debit the reservation (admin completed withdrawal). Reduces reserved,
   * leaving available unchanged.
   */
  async debitReservation(
    tx: Tx,
    userId: string,
    amount: number,
    ref: { type: string; id: string; description?: string },
  ): Promise<void> {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: amount },
        version: { increment: 1 },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: WalletLedgerType.WITHDRAWAL_DEBIT,
        amount,
        balanceAfter: updated.availableBalance,
        referenceType: ref.type,
        referenceId: ref.id,
        description: ref.description,
      },
    });
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

// Sentinel error — caller translates to HTTP 400.
export class InsufficientBalanceError extends Error {
  constructor() {
    super('Insufficient balance');
    this.name = 'InsufficientBalanceError';
  }
}
