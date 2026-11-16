/**
 * One-time server setup for a cPanel host, run from the Node.js app page
 * ("Run JS script" → setup:secrets). Nobody types or sees a secret:
 *
 *   1. generates a strong random MySQL password and creates (or resets) the
 *      app's database user with cPanel's own `uapi`, granting it ALL
 *      PRIVILEGES on the app database only;
 *   2. generates JWT_SECRET;
 *   3. writes both to <app root>/.bb365-secrets.json with mode 0600. The app
 *      root is outside the web root, so the file is never served. app.js and
 *      the maintenance scripts load it (scripts/load-secrets.js); variables
 *      set in cPanel take precedence.
 *
 * Idempotent: if the secrets file already exists it does nothing. Output names
 * what was done, never a value.
 *
 * Env (optional): BB365_DB_NAME (default betboosc_bb365),
 *                 BB365_DB_USER (default betboosc_bb365u)
 */
import { spawnSync } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');
const SECRETS_FILE = path.join(APP_ROOT, '.bb365-secrets.json');
const DB_NAME = process.env.BB365_DB_NAME || 'betboosc_bb365';
const DB_USER = process.env.BB365_DB_USER || 'betboosc_bb365u';

type UapiResult = { status: number; errors: string[] | null; data: unknown };

/** Call cPanel UAPI. Arguments are never printed: they may contain the new password. */
function uapi(module: string, fn: string, args: Record<string, string> = {}): UapiResult {
  const argv = ['--output=json', module, fn, ...Object.entries(args).map(([k, v]) => `${k}=${v}`)];
  const run = spawnSync('uapi', argv, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (run.error) throw new Error(`uapi ${module}::${fn} could not start: ${run.error.message}`);
  let parsed: { result?: UapiResult };
  try {
    parsed = JSON.parse(run.stdout);
  } catch {
    throw new Error(`uapi ${module}::${fn} returned unreadable output (exit ${run.status})`);
  }
  const result = parsed.result;
  if (!result) throw new Error(`uapi ${module}::${fn} returned no result`);
  if (result.status !== 1) {
    throw new Error(`uapi ${module}::${fn} failed: ${(result.errors ?? ['unknown error']).join('; ')}`);
  }
  return result;
}

/** Letters and digits only, so the password is safe inside a connection URL. */
function password(length = 32): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  // Guarantee every class appears (some cPanel strength checks want a mix).
  out += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[randomInt(24)];
  out += 'abcdefghijkmnopqrstuvwxyz'[randomInt(25)];
  out += '23456789'[randomInt(8)];
  while (out.length < length) out += alphabet[randomInt(alphabet.length)];
  return out
    .split('')
    .sort(() => randomInt(3) - 1)
    .join('');
}

function main() {
  if (fs.existsSync(SECRETS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8')) as Record<string, string>;
    const keys = Object.keys(existing).filter((k) => k !== 'createdAt');
    console.log(`[setup] ${path.basename(SECRETS_FILE)} already exists (${keys.join(', ')}). Nothing changed.`);
    return;
  }

  const dbs = uapi('Mysql', 'list_databases').data as { database: string }[];
  if (!dbs.some((d) => d.database === DB_NAME)) {
    throw new Error(`Database ${DB_NAME} does not exist. Create it in cPanel first.`);
  }

  const dbPassword = password(32);
  const users = uapi('Mysql', 'list_users').data as { user: string }[];
  if (users.some((u) => u.user === DB_USER)) {
    uapi('Mysql', 'set_password', { user: DB_USER, password: dbPassword });
    console.log(`[setup] Database user ${DB_USER} existed; its password was replaced with a new random one.`);
  } else {
    uapi('Mysql', 'create_user', { name: DB_USER, password: dbPassword });
    console.log(`[setup] Created database user ${DB_USER}.`);
  }
  uapi('Mysql', 'set_privileges_on_database', {
    user: DB_USER,
    database: DB_NAME,
    privileges: 'ALL PRIVILEGES',
  });
  console.log(`[setup] Granted ALL PRIVILEGES on ${DB_NAME} to ${DB_USER} (this database only).`);

  const secrets = {
    MYSQL_DATABASE_URL: `mysql://${DB_USER}:${dbPassword}@localhost:3306/${DB_NAME}`,
    JWT_SECRET: randomBytes(48).toString('base64url'),
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(SECRETS_FILE, 0o600);
  console.log(`[setup] Wrote MYSQL_DATABASE_URL and JWT_SECRET to ${SECRETS_FILE} (mode 600). Values are not shown.`);
  console.log('[setup] Next: run db:migrate, then restart the app.');
}

try {
  main();
} catch (e) {
  console.error('[setup] Failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
