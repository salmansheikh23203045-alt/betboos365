import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditAction, BonusType, Prisma, WalletLedgerType } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletService } from '../wallet/wallet.service';
import { WALLET_CONFIG } from '../wallet/wallet.config';
import { TelegramClient } from './telegram.client';
import { telegramConfig } from './telegram.config';
import { parseRoles } from '../common/utils/roles';

// Bonuses are for players. Every staff role is excluded, Super Admin included.
const STAFF_ROLES = new Set(['super_admin', 'admin', 'sub_admin', 'agent', 'moderator']);
const isStaff = (roles: unknown) => (parseRoles(roles) as string[]).some((r) => STAFF_ROLES.has(r));

const CODE_TTL_MS = 10 * 60_000;
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/** The parts of a Telegram update the webhook reads. Everything else is ignored. */
export interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number; type?: string };
    from?: { id: number; is_bot?: boolean; username?: string };
  };
}

/**
 * Telegram community bonus.
 *
 *   1. The player opens the group (plain link, nothing recorded).
 *   2. POST link issues a one-time code; the player opens our bot with it.
 *   3. Telegram delivers "/start <code>" to the webhook, which proves which
 *      Telegram account the player controls and links it to their account.
 *   4. POST claim asks Telegram whether that account is in the group and, if
 *      so, credits the bonus once, atomically, with a ledger entry.
 *
 * Clicking a button never credits anything. If Telegram is not configured or
 * cannot answer, nothing is credited.
 */
@Injectable()
export class BonusService {
  private readonly logger = new Logger(BonusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly wallet: WalletService,
    private readonly telegram: TelegramClient,
  ) {}

  async status(userId: string) {
    const cfg = telegramConfig();
    const [link, claim] = await Promise.all([
      this.prisma.telegramLink.findUnique({ where: { userId } }),
      this.prisma.bonusClaim.findUnique({
        where: { userId_type: { userId, type: BonusType.TELEGRAM_JOIN } },
      }),
    ]);
    return {
      configured: cfg.configured,
      enabled: cfg.configured && cfg.enabled,
      amount: cfg.amount,
      currency: WALLET_CONFIG.currency,
      groupUrl: cfg.groupUrl,
      linked: Boolean(link),
      telegramUsername: link?.telegramUsername ?? null,
      claimed: Boolean(claim),
      claimedAt: claim?.createdAt.toISOString() ?? null,
      claimedAmount: claim ? Number(claim.amount) : null,
    };
  }

  private requireEnabled() {
    const cfg = telegramConfig();
    if (!cfg.configured || !cfg.enabled) {
      throw new ServiceUnavailableException('Telegram bonus verification is not available right now.');
    }
    return cfg;
  }

  /** Issue a one-time deep-link code. Earlier unused codes for this player stop working. */
  async createLink(userId: string) {
    const cfg = this.requireEnabled();
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true, isActive: true } });
    if (!account?.isActive || isStaff(account.roles)) {
      throw new ForbiddenException('This bonus is only available to player accounts.');
    }
    const claimed = await this.prisma.bonusClaim.findUnique({
      where: { userId_type: { userId, type: BonusType.TELEGRAM_JOIN } },
      select: { id: true },
    });
    if (claimed) throw new ConflictException('You have already received the Telegram bonus.');

    const code = randomBytes(24).toString('base64url'); // 32 chars, allowed in /start payloads
    await this.prisma.$transaction([
      this.prisma.telegramLinkCode.deleteMany({ where: { userId, usedAt: null } }),
      this.prisma.telegramLinkCode.create({
        data: { userId, codeHash: sha256(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
      }),
    ]);
    return {
      deepLink: `https://t.me/${cfg.botUsername}?start=${code}`,
      expiresInSeconds: CODE_TTL_MS / 1000,
    };
  }

  /** Webhook: "/start <code>" in a private chat with the bot links the sender. */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const msg = update.message;
    const text = msg?.text?.trim() ?? '';
    const from = msg?.from;
    if (!msg || !from || from.is_bot || msg.chat?.type !== 'private') return;
    const chatId = msg.chat.id;

    const match = /^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{16,64})$/.exec(text);
    if (!match) {
      if (text.startsWith('/start')) {
        await this.telegram.sendMessage(
          chatId,
          'Open this bot from the BetBoos365 website (Verify & Claim) to link your account.',
        );
      }
      return;
    }

    const telegramUserId = String(from.id);
    const reply = await this.prisma.$transaction(async (tx) => {
      // Consume the code first: a code works once, whatever happens next.
      const code = await tx.telegramLinkCode.findUnique({ where: { codeHash: sha256(match[1]) } });
      if (!code || code.usedAt || code.expiresAt < new Date()) {
        return 'This link has expired. Go back to the website and tap Verify & Claim again.';
      }
      const consumed = await tx.telegramLinkCode.updateMany({
        where: { id: code.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count === 0) return 'This link has already been used.';

      const user = await tx.user.findUnique({
        where: { id: code.userId },
        select: { id: true, username: true, isActive: true, roles: true },
      });
      if (!user || !user.isActive) return 'This BetBoos365 account is not active.';
      if (isStaff(user.roles)) return 'This bonus is only available to player accounts.';

      const owner = await tx.telegramLink.findUnique({ where: { telegramUserId } });
      if (owner && owner.userId !== user.id) {
        return 'This Telegram account is already linked to another BetBoos365 account.';
      }
      // Once a bonus has been paid against a Telegram account the link is fixed.
      const claim = await tx.bonusClaim.findUnique({
        where: { userId_type: { userId: user.id, type: BonusType.TELEGRAM_JOIN } },
      });
      if (claim) return 'Your account has already received the Telegram bonus.';

      await tx.telegramLink.upsert({
        where: { userId: user.id },
        update: { telegramUserId, telegramUsername: from.username ?? null, linkedAt: new Date() },
        create: { userId: user.id, telegramUserId, telegramUsername: from.username ?? null },
      });
      await tx.auditLog.create({
        data: {
          action: AuditAction.PROFILE_UPDATE,
          userId: user.id,
          metadata: { action: 'telegram_linked', telegramUserId },
        },
      });
      return `Linked to BetBoos365 account "${user.username}". Go back to the website to finish claiming your bonus.`;
    }).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return 'This Telegram account is already linked to another BetBoos365 account.';
      }
      this.logger.error(`Telegram link failed: ${err instanceof Error ? err.message : err}`);
      return 'Something went wrong. Please try again from the website.';
    });

    await this.telegram.sendMessage(chatId, reply);
  }

  async claim(userId: string, ip?: string, ua?: string) {
    const cfg = this.requireEnabled();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, roles: true, telegramLink: true },
    });
    if (!user?.isActive) throw new ForbiddenException('This account is not active.');
    if (isStaff(user.roles)) throw new ForbiddenException('This bonus is only available to player accounts.');

    const existing = await this.prisma.bonusClaim.findUnique({
      where: { userId_type: { userId, type: BonusType.TELEGRAM_JOIN } },
    });
    if (existing) throw new ConflictException('You have already received the Telegram bonus.');

    const link = user.telegramLink;
    if (!link) {
      throw new BadRequestException({
        message: 'Link your Telegram account first: tap Verify & Claim and press Start in the bot.',
        error: 'TelegramNotLinked',
      });
    }

    const membership = await this.telegram.membership(link.telegramUserId);
    if (membership === 'unavailable') {
      throw new BadGatewayException('Telegram could not confirm your membership right now. Please try again shortly.');
    }
    if (membership !== 'member') {
      throw new BadRequestException({
        message: 'We could not find your Telegram account in the BetBoos365 group. Join the group, then try again.',
        error: 'TelegramNotMember',
      });
    }

    let balance: Prisma.Decimal;
    let claimId: string;
    try {
      ({ balance, claimId } = await this.prisma.$transaction(async (tx) => {
        // The unique keys (player, type) and (type, Telegram account) make a
        // second claim fail here, inside the same transaction as the credit.
        const claim = await tx.bonusClaim.create({
          data: {
            userId,
            type: BonusType.TELEGRAM_JOIN,
            amount: cfg.amount,
            currency: WALLET_CONFIG.currency,
            telegramUserId: link.telegramUserId,
          },
        });
        await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId, currency: WALLET_CONFIG.currency },
        });
        const after = await this.wallet.credit(tx, userId, cfg.amount, WalletLedgerType.BONUS_CREDIT, {
          type: 'BONUS',
          id: claim.id,
          description: 'Telegram community welcome bonus',
        });
        return { balance: after, claimId: claim.id };
      }));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('This bonus has already been claimed for this account or Telegram account.');
      }
      throw err;
    }

    await this.audit.logSafe(
      AuditAction.PROMOTION_CLAIM,
      userId,
      { bonus: 'TELEGRAM_JOIN', claimId, amount: cfg.amount, telegramUserId: link.telegramUserId },
      ip,
      ua,
    );
    this.logger.log(`Telegram bonus credited: claim ${claimId}`);
    return { claimed: true, amount: cfg.amount, currency: WALLET_CONFIG.currency, balance: Number(balance) };
  }

  async adminList(page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const where = { type: BonusType.TELEGRAM_JOIN };
    const [rows, total, sum] = await this.prisma.$transaction([
      this.prisma.bonusClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { username: true, telegramLink: { select: { telegramUsername: true } } } } },
      }),
      this.prisma.bonusClaim.count({ where }),
      this.prisma.bonusClaim.aggregate({ where, _sum: { amount: true } }),
    ]);
    const cfg = telegramConfig();
    return {
      data: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        username: r.user.username,
        telegramUserId: r.telegramUserId,
        telegramUsername: r.user.telegramLink?.telegramUsername ?? null,
        amount: Number(r.amount),
        currency: r.currency,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        total,
        page: Math.max(page, 1),
        limit: take,
        totalPages: Math.max(1, Math.ceil(total / take)),
        totalPaid: Number(sum._sum.amount ?? 0),
        configured: cfg.configured,
        enabled: cfg.configured && cfg.enabled,
        amount: cfg.amount,
      },
    };
  }
}
