import { Permission, Role } from './interfaces';

const P = Permission;

/** Everything the main Admin can do. Managing other Admins stays with Super Admin. */
export const ADMIN_PERMISSIONS: Permission[] = [
  P.DASHBOARD_VIEW,
  P.USERS_VIEW,
  P.USERS_MANAGE,
  P.SUB_ADMINS_MANAGE,
  P.AGENTS_MANAGE,
  P.DEPOSITS_VIEW,
  P.DEPOSITS_REVIEW,
  P.WITHDRAWALS_VIEW,
  P.WITHDRAWALS_REVIEW,
  P.WITHDRAWALS_ASSIGN,
  P.WITHDRAWALS_COMPLETE,
  P.TRANSACTIONS_VIEW,
  P.WALLET_ADJUST,
  P.AUDIT_VIEW,
  P.CONTENT_MANAGE,
  P.SETTINGS_MANAGE,
];

export const SUPER_ADMIN_PERMISSIONS: Permission[] = [...ADMIN_PERMISSIONS, P.ADMINS_MANAGE];

/** The only permissions a Sub Admin can ever hold, whatever is stored on the account. */
export const SUB_ADMIN_GRANTABLE: Permission[] = [
  P.DEPOSITS_VIEW,
  P.DEPOSITS_REVIEW,
  P.WITHDRAWALS_VIEW,
  P.WITHDRAWALS_REVIEW,
  P.WITHDRAWALS_ASSIGN,
  P.WITHDRAWALS_COMPLETE,
  P.TRANSACTIONS_VIEW,
];

/** What a new Sub Admin starts with: view and review deposits and withdrawals, plus their records. */
export const SUB_ADMIN_DEFAULT: Permission[] = [
  P.DEPOSITS_VIEW,
  P.DEPOSITS_REVIEW,
  P.WITHDRAWALS_VIEW,
  P.WITHDRAWALS_REVIEW,
  P.TRANSACTIONS_VIEW,
];

export const AGENT_PERMISSIONS: Permission[] = [P.AGENT_WITHDRAWALS_PROCESS];

function parseStored(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
    } catch {
      /* fall through */
    }
  }
  return null;
}

/** A Sub Admin's stored list, clamped to the grantable set. Missing or invalid storage means defaults. */
export function subAdminPermissions(stored: unknown): Permission[] {
  const list = parseStored(stored);
  if (!list) return [...SUB_ADMIN_DEFAULT];
  return SUB_ADMIN_GRANTABLE.filter((p) => list.includes(p));
}

/**
 * Permissions a principal actually holds. Computed from the roles and the
 * stored permission list read from the database on every request, never from
 * anything the client sends.
 */
export function effectivePermissions(roles: readonly string[], stored: unknown): Permission[] {
  const set = new Set<Permission>();
  if (roles.includes(Role.SUPER_ADMIN)) SUPER_ADMIN_PERMISSIONS.forEach((p) => set.add(p));
  if (roles.includes(Role.ADMIN)) ADMIN_PERMISSIONS.forEach((p) => set.add(p));
  if (roles.includes(Role.SUB_ADMIN)) subAdminPermissions(stored).forEach((p) => set.add(p));
  if (roles.includes(Role.AGENT)) AGENT_PERMISSIONS.forEach((p) => set.add(p));
  return [...set];
}

/**
 * Admin, Sub Admin and Agent accounts are staff: they have a dashboard, not a
 * player account, so player features (profile, wallet, deposit, withdraw) are
 * closed to them. Super Admin keeps its existing access.
 */
export function isRestrictedStaff(roles: readonly string[]): boolean {
  if (roles.includes(Role.SUPER_ADMIN)) return false;
  return roles.includes(Role.ADMIN) || roles.includes(Role.SUB_ADMIN) || roles.includes(Role.AGENT);
}
