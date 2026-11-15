// Telegram community bonus settings, all from the environment.
//
//   TELEGRAM_BOT_TOKEN        token from @BotFather (secret)
//   TELEGRAM_BOT_USERNAME     the bot's @username, without the @
//   TELEGRAM_CHAT_ID          group/channel to check: "@betboos365" or a numeric id
//   TELEGRAM_WEBHOOK_SECRET   random string Telegram echoes in a header (secret)
//   TELEGRAM_GROUP_URL        public join link shown to players
//   TELEGRAM_BONUS_AMOUNT     BDT credited once per eligible player (default 30)
//   TELEGRAM_BONUS_ENABLED    "false" switches claiming off without a redeploy
//   TELEGRAM_API_BASE         override for tests; defaults to the real Bot API
//
// Claiming is only possible when the token, bot username, chat id and webhook
// secret are all set. Without them the API reports `configured: false` and
// never credits anything.

function amount(): number {
  const raw = Number(process.env.TELEGRAM_BONUS_AMOUNT ?? 30);
  return Number.isFinite(raw) && raw > 0 && raw <= 10_000 ? Math.round(raw * 100) / 100 : 30;
}

export function telegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const botUsername = (process.env.TELEGRAM_BOT_USERNAME ?? '').trim().replace(/^@/, '');
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? '';
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? '';
  return {
    botToken,
    botUsername,
    chatId,
    webhookSecret,
    groupUrl: process.env.TELEGRAM_GROUP_URL?.trim() || 'https://t.me/betboos365',
    amount: amount(),
    enabled: process.env.TELEGRAM_BONUS_ENABLED !== 'false',
    apiBase: (process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org').replace(/\/$/, ''),
    configured: Boolean(botToken && botUsername && chatId && webhookSecret),
  };
}

export type TelegramConfig = ReturnType<typeof telegramConfig>;
