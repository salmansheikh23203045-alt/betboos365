import { Injectable, Logger } from '@nestjs/common';
import { telegramConfig } from './telegram.config';

export type MembershipResult = 'member' | 'not_member' | 'unavailable';

const MEMBER_STATUSES = new Set(['creator', 'administrator', 'member']);

/** Minimal Telegram Bot API client. The token never appears in logs or errors. */
@Injectable()
export class TelegramClient {
  private readonly logger = new Logger(TelegramClient.name);

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
    const cfg = telegramConfig();
    if (!cfg.botToken) return null;
    try {
      const res = await fetch(`${cfg.apiBase}/bot${cfg.botToken}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8_000),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; result?: T; description?: string; error_code?: number }
        | null;
      if (!json?.ok) {
        this.logger.warn(`Telegram ${method} failed: ${json?.error_code ?? res.status} ${json?.description ?? ''}`);
        return null;
      }
      return json.result ?? null;
    } catch (err) {
      this.logger.warn(`Telegram ${method} unreachable: ${err instanceof Error ? err.name : 'error'}`);
      return null;
    }
  }

  /**
   * Is this Telegram user currently in the configured group/channel?
   * "unavailable" means Telegram could not answer (bot not in the chat,
   * network, bad token): callers must not treat it as either answer.
   */
  async membership(telegramUserId: string): Promise<MembershipResult> {
    const cfg = telegramConfig();
    const res = await fetch(`${cfg.apiBase}/bot${cfg.botToken}/getChatMember`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.chatId, user_id: Number(telegramUserId) }),
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null);
    if (!res) return 'unavailable';
    const json = (await res.json().catch(() => null)) as
      | { ok: boolean; result?: { status?: string; is_member?: boolean }; description?: string }
      | null;
    if (!json) return 'unavailable';
    if (!json.ok) {
      // "user not found" / "PARTICIPANT_ID_INVALID": the user has never been in the chat.
      if (/user not found|participant_id_invalid/i.test(json.description ?? '')) return 'not_member';
      this.logger.warn(`Telegram getChatMember failed: ${json.description ?? res.status}`);
      return 'unavailable';
    }
    const status = json.result?.status ?? '';
    if (MEMBER_STATUSES.has(status)) return 'member';
    if (status === 'restricted' && json.result?.is_member === true) return 'member';
    return 'not_member';
  }

  async sendMessage(chatId: number | string, text: string): Promise<void> {
    await this.call('sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });
  }
}
