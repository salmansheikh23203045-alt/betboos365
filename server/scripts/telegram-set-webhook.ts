/**
 * Register (or inspect) the Telegram webhook for the community bonus bot.
 *
 *   TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… \
 *   PUBLIC_API_URL=https://<your-domain>/api/v1 \
 *   npx ts-node scripts/telegram-set-webhook.ts            # register
 *   npx ts-node scripts/telegram-set-webhook.ts --info     # show current status
 *
 * Telegram only delivers to HTTPS URLs with a valid certificate. Only
 * "message" updates are requested; the token is never printed.
 */
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const base = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const api = (m: string, body?: unknown) =>
    fetch(`${base}/bot${token}/${m}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }).then((r) => r.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>);

  if (process.argv.includes('--info')) {
    const me = await api('getMe');
    const info = await api('getWebhookInfo');
    console.log(JSON.stringify({ bot: me.result, webhook: info.result }, null, 2));
    return;
  }

  const apiUrl = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!apiUrl?.startsWith('https://')) throw new Error('PUBLIC_API_URL must be the https:// API base, e.g. https://example.com/api/v1');
  if (!secret || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET must be 16–256 characters of A-Z a-z 0-9 _ -');
  }
  const res = await api('setWebhook', {
    url: `${apiUrl}/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
  console.log(res.ok ? `Webhook set to ${apiUrl}/telegram/webhook` : `Failed: ${res.description}`);
  if (!res.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
