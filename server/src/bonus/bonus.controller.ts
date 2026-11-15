import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';
import { CurrentUser, PlayerOnly, Public, RequirePermissions, Roles } from '../common/decorators';
import { Permission, Role } from '../common/interfaces';
import { UserThrottlerGuard } from '../common/guards/user-throttler.guard';
import { BonusService, TelegramUpdate } from './bonus.service';
import { telegramConfig } from './telegram.config';

/** Player side of the Telegram community bonus. Staff accounts are refused. */
@Controller('bonus/telegram')
@PlayerOnly()
export class TelegramBonusController {
  constructor(private readonly bonus: BonusService) {}

  @Get()
  status(@CurrentUser('id') userId: string) {
    return this.bonus.status(userId);
  }

  @Post('link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  link(@CurrentUser('id') userId: string) {
    return this.bonus.createLink(userId);
  }

  @Post('claim')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  claim(@CurrentUser('id') userId: string, @Ip() ip: string, @Headers('user-agent') ua?: string) {
    return this.bonus.claim(userId, ip, ua);
  }
}

/**
 * Telegram Bot API webhook. Public, but every call must carry the secret
 * registered with setWebhook in X-Telegram-Bot-Api-Secret-Token.
 */
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(private readonly bonus: BonusService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ) {
    const expected = telegramConfig().webhookSecret;
    const a = Buffer.from(secret ?? '');
    const b = Buffer.from(expected);
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
    try {
      await this.bonus.handleUpdate(update ?? {});
    } catch (err) {
      // Always acknowledge, or Telegram retries the same update indefinitely.
      this.logger.error(`Webhook update failed: ${err instanceof Error ? err.message : err}`);
    }
    return { ok: true };
  }
}

/** Admin visibility of paid Telegram bonuses. */
@Controller('admin/bonuses')
@Roles(Role.ADMIN, Role.SUB_ADMIN)
@RequirePermissions(Permission.TRANSACTIONS_VIEW)
export class AdminBonusController {
  constructor(private readonly bonus: BonusService) {}

  @Get('telegram')
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.bonus.adminList(page, limit);
  }
}
