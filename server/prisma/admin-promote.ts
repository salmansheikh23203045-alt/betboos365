/**
 * admin-promote — one-shot CLI that promotes an existing user to the admin
 * role. The target user must already exist (created via the live /signup
 * flow with a password of THEIR choosing).
 *
 * Why a CLI instead of a seed row:
 *   • No default passwords ever land in the repo or in the database.
 *   • The owner can rotate their password through the normal flow if a
 *     shoulder-surfer saw the Railway UI.
 *   • The script refuses to create a user, only promote an existing one —
 *     eliminating the "accidentally created unknown-password admin" risk.
 *
 * Usage (anywhere, with DATABASE_URL set):
 *   npm run admin:promote -- <username>
 *   npm run admin:promote -- --revoke <username>     # remove admin role
 *   npm run admin:promote -- --list                  # list current admins
 *
 * On Railway: open the service's shell (dashboard → Service → three-dot
 * menu → Shell), then run `npm run admin:promote -- <your_username>`. Wait
 * for the "Promoted" line before closing.
 */
import { PrismaClient, UserRole, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function parseRoles(value: unknown): UserRole[] {
  if (Array.isArray(value)) return value as UserRole[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as UserRole[];
    } catch { /* fall through */ }
  }
  return [];
}

function usage(): never {
  console.error(
    [
      'Usage:',
      '  npm run admin:promote -- <username>            # grant admin role',
      '  npm run admin:promote -- --revoke <username>   # remove admin role',
      '  npm run admin:promote -- --list                # list current admins',
    ].join('\n'),
  );
  process.exit(2);
}

async function listAdmins() {
  // MySQL Json field: use an OR of `array_contains` checks (no `hasSome`).
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { roles: { array_contains: UserRole.admin } },
        { roles: { array_contains: UserRole.super_admin } },
      ],
    },
    select: { username: true, email: true, roles: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (admins.length === 0) {
    console.log('(no admins yet — register an account at /signup, then re-run with its username to promote it)');
    return;
  }
  console.log(`${admins.length} admin account(s):`);
  for (const a of admins) {
    const activeFlag = a.isActive ? '' : ' [DEACTIVATED]';
    console.log(
      `  • ${a.username}${activeFlag} <${a.email ?? 'no-email'}> roles=[${parseRoles(a.roles).join(',')}] since ${a.createdAt.toISOString()}`,
    );
  }
}

async function setAdmin(username: string, mode: 'grant' | 'revoke') {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, email: true, roles: true, isActive: true },
  });
  if (!user) {
    console.error(`No user with username "${username}". Register one via /signup first.`);
    process.exit(1);
  }
  if (!user.isActive) {
    console.error(`User "${user.username}" is DEACTIVATED. Reactivate before promoting.`);
    process.exit(1);
  }

  const currentRoles = parseRoles(user.roles);
  const already = currentRoles.includes(UserRole.admin);
  if (mode === 'grant' && already) {
    console.log(`"${user.username}" already has admin. No change.`);
    return;
  }
  if (mode === 'revoke' && !already) {
    console.log(`"${user.username}" is not an admin. No change.`);
    return;
  }

  const nextRoles =
    mode === 'grant'
      ? Array.from(new Set([...currentRoles, UserRole.admin]))
      : currentRoles.filter((r) => r !== UserRole.admin);

  await prisma.user.update({
    where: { id: user.id },
    data: { roles: nextRoles as unknown as Prisma.InputJsonValue },
  });

  await prisma.auditLog.create({
    data: {
      action: 'ADMIN_ACTION',
      userId: user.id,
      metadata: {
        action: mode === 'grant' ? 'admin_role_granted' : 'admin_role_revoked',
        via: 'admin-promote CLI',
        resultingRoles: nextRoles,
      },
    },
  });

  console.log(
    `${mode === 'grant' ? 'Promoted' : 'Revoked'} "${user.username}". Roles now: [${nextRoles.join(',')}]`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  if (args.includes('--list')) {
    await listAdmins();
    return;
  }

  if (args[0] === '--revoke') {
    const username = args[1];
    if (!username) usage();
    await setAdmin(username, 'revoke');
    return;
  }

  if (args.length !== 1 || args[0].startsWith('--')) usage();
  await setAdmin(args[0], 'grant');
}

main()
  .catch((e) => {
    console.error('admin-promote failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
