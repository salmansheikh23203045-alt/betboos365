/**
 * Applies Prisma migrations WITHOUT the Prisma CLI.
 *
 *   MYSQL_DATABASE_URL=… node scripts/apply-migrations.js            # apply pending
 *   MYSQL_DATABASE_URL=… node scripts/apply-migrations.js --status   # list only
 *
 * Why: on CloudLinux shared hosting the Prisma CLI cannot start (its
 * WebAssembly module hits the account's memory limit), but the Prisma
 * runtime client works. This script does what `prisma migrate deploy` does,
 * using the runtime client only:
 *
 *   - creates `_prisma_migrations` exactly as Prisma does (if missing);
 *   - applies each migrations/<name>/migration.sql not yet recorded as
 *     finished, in name order, statement by statement;
 *   - records each one with Prisma's checksum (SHA-256 of the file), so the
 *     history stays compatible with `prisma migrate status/deploy` later.
 *
 * It never edits or re-runs a finished migration, and it stops at the first
 * failure (recording the error in `logs`), like Prisma. Only additive SQL is
 * expected here; review migration files before deploying them.
 */
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(
  process.env.MIGRATIONS_DIR ?? path.join(__dirname, '..', 'server', 'prisma', 'migrations'),
);

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
    \`id\`                      VARCHAR(36) PRIMARY KEY NOT NULL,
    \`checksum\`                VARCHAR(64) NOT NULL,
    \`finished_at\`             DATETIME(3),
    \`migration_name\`          VARCHAR(255) NOT NULL,
    \`logs\`                    TEXT,
    \`rolled_back_at\`          DATETIME(3),
    \`started_at\`              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`applied_steps_count\`     INTEGER UNSIGNED NOT NULL DEFAULT 0
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

/** Split a migration file into statements. Comments are dropped; our files hold no procedures. */
function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Row = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; checksum: string };

async function main() {
  const statusOnly = process.argv.includes('--status');
  const prisma = new PrismaClient();
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) throw new Error(`Migrations folder not found: ${MIGRATIONS_DIR}`);
    const names = fs
      .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(MIGRATIONS_DIR, d.name, 'migration.sql')))
      .map((d) => d.name)
      .sort();

    await prisma.$executeRawUnsafe(CREATE_TABLE);
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      'SELECT migration_name, finished_at, rolled_back_at, checksum FROM `_prisma_migrations`',
    );

    const unfinished = rows.filter((r) => !r.finished_at && !r.rolled_back_at);
    if (unfinished.length) {
      throw new Error(
        `A previous migration did not finish: ${unfinished.map((r) => r.migration_name).join(', ')}. ` +
          'Resolve it before applying more.',
      );
    }
    const done = new Map(rows.filter((r) => r.finished_at).map((r) => [r.migration_name, r.checksum]));

    let applied = 0;
    for (const name of names) {
      const file = path.join(MIGRATIONS_DIR, name, 'migration.sql');
      const sql = fs.readFileSync(file, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      if (done.has(name)) {
        const note = done.get(name) === checksum ? 'applied' : 'applied (WARNING: file changed since it was applied)';
        console.log(`  ${note.padEnd(10)} ${name}`);
        continue;
      }
      if (statusOnly) {
        console.log(`  pending    ${name}`);
        continue;
      }

      const id = randomUUID();
      await prisma.$executeRawUnsafe(
        'INSERT INTO `_prisma_migrations` (id, checksum, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, NOW(3), 0)',
        id,
        checksum,
        name,
      );
      try {
        for (const stmt of statements(sql)) await prisma.$executeRawUnsafe(stmt);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.$executeRawUnsafe('UPDATE `_prisma_migrations` SET logs = ? WHERE id = ?', message, id);
        throw new Error(`Migration ${name} failed: ${message}`);
      }
      await prisma.$executeRawUnsafe(
        'UPDATE `_prisma_migrations` SET finished_at = NOW(3), applied_steps_count = 1 WHERE id = ?',
        id,
      );
      applied++;
      console.log(`  applied    ${name}`);
    }
    console.log(statusOnly ? '[migrate] Status only; nothing changed.' : `[migrate] Done. ${applied} migration(s) applied.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  // Message only: Prisma errors can include the connection host.
  console.error('[migrate] Failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
