/**
 * One-time bootstrap of the initial staff accounts: Super Admin, Sub Admin, Agent.
 *
 *   BOOTSTRAP_SUPER_ADMIN_PASSWORD=… \
 *   BOOTSTRAP_SUB_ADMIN_PASSWORD=…   \
 *   BOOTSTRAP_AGENT_PASSWORD=…       \
 *   npm run staff:bootstrap
 *
 * Safety properties:
 *   • Passwords are read from the environment only. Nothing is hardcoded here,
 *     printed, or written anywhere except as a bcrypt hash.
 *   • Every account is created with mustChangePassword = true, so the API
 *     refuses everything but "change password" until the temporary password
 *     is replaced. The replacement clears the flag and ends all sessions.
 *   • Idempotent: an existing username is never modified (no password reset,
 *     no role change). Re-running after deployment is a no-op.
 *   • Concurrent runs are safe: the unique index on username decides, and the
 *     loser is reported as "already exists".
 *   • Each creation writes an audit log entry.
 *
 * Accounts whose password variable is unset are skipped, so the script can be
 * run for a single role.
 */
import { AuditAction, Prisma, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type Spec = {
  username: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  passwordEnv: string;
  permissions?: string[];
};

// Mirrors SUB_ADMIN_DEFAULT in src/common/permissions.ts: review deposits and
// withdrawals and read their records. Super Admin can widen it from the
// dashboard, within SUB_ADMIN_GRANTABLE.
const SUB_ADMIN_DEFAULT = [
  'deposits.view',
  'deposits.review',
  'withdrawals.view',
  'withdrawals.review',
  'transactions.view',
];

const SPECS: Spec[] = [
  {
    username: 'admin',
    role: UserRole.super_admin,
    firstName: 'Super',
    lastName: 'Admin',
    passwordEnv: 'BOOTSTRAP_SUPER_ADMIN_PASSWORD',
  },
  {
    // Usernames are stored lowercase; login lowercases input, so "subAdmin" works.
    username: 'subadmin',
    role: UserRole.sub_admin,
    firstName: 'Sub',
    lastName: 'Admin',
    passwordEnv: 'BOOTSTRAP_SUB_ADMIN_PASSWORD',
    permissions: SUB_ADMIN_DEFAULT,
  },
  {
    username: 'agent',
    role: UserRole.agent,
    firstName: 'Agent',
    lastName: 'Agent',
    passwordEnv: 'BOOTSTRAP_AGENT_PASSWORD',
  },
];

const prisma = new PrismaClient();

function rolesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
    } catch {
      /* not JSON */
    }
  }
  return [];
}

async function ensure(spec: Spec): Promise<'created' | 'exists' | 'skipped'> {
  const password = process.env[spec.passwordEnv];
  if (!password) {
    console.log(`  ${spec.username}: ${spec.passwordEnv} not set, skipped`);
    return 'skipped';
  }

  const existing = await prisma.user.findUnique({
    where: { username: spec.username },
    select: { id: true, roles: true },
  });
  if (existing) {
    const roles = rolesOf(existing.roles);
    const note = roles.includes(spec.role) ? '' : ` (WARNING: holds [${roles.join(', ')}], not ${spec.role}; left unchanged)`;
    console.log(`  ${spec.username}: already exists, left unchanged${note}`);
    return 'exists';
  }

  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: spec.username,
          firstName: spec.firstName,
          lastName: spec.lastName,
          passwordHash,
          mustChangePassword: true,
          roles: [spec.role] as unknown as Prisma.InputJsonValue,
          ...(spec.permissions
            ? { permissions: spec.permissions as unknown as Prisma.InputJsonValue }
            : {}),
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          action: AuditAction.ADMIN_ACTION,
          userId: user.id,
          metadata: {
            action: 'bootstrap_account_created',
            source: 'cli',
            role: spec.role,
            mustChangePassword: true,
          },
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      console.log(`  ${spec.username}: created concurrently by another run, left unchanged`);
      return 'exists';
    }
    throw err;
  }
  console.log(`  ${spec.username}: created as ${spec.role}, password change required at first login`);
  return 'created';
}

async function main() {
  console.log('[staff:bootstrap] Ensuring initial staff accounts…');
  let created = 0;
  for (const spec of SPECS) {
    if ((await ensure(spec)) === 'created') created++;
  }
  console.log(`[staff:bootstrap] Done. ${created} account(s) created.`);
  if (created > 0) {
    console.log('[staff:bootstrap] Sign in to each new account now and set a strong password.');
  }
}

main()
  .catch((e) => {
    // Print the message only: Prisma errors can include the connection string host.
    console.error('[staff:bootstrap] Failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
