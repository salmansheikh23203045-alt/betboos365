// Role helpers shared by the proxy, server components and client components.
// These only decide what to SHOW and where to send someone; the backend
// re-checks every role and permission on every request.

export type Role = "user" | "vip" | "moderator" | "admin" | "super_admin" | "agent" | "sub_admin";

type Roles = readonly string[];

export const isSuperAdmin = (roles: Roles) => roles.includes("super_admin");
export const isAdmin = (roles: Roles) => roles.includes("admin") || roles.includes("super_admin");
export const isSubAdmin = (roles: Roles) => roles.includes("sub_admin");
export const isAgent = (roles: Roles) => roles.includes("agent");

/** May open the Admin Dashboard (Sub Admins see a restricted version). */
export const canUseAdminDashboard = (roles: Roles) => isAdmin(roles) || isSubAdmin(roles);

/**
 * Admin, Sub Admin and Agent accounts have a dashboard instead of a player
 * account: no profile page, no wallet, no deposit or withdraw. Super Admin
 * keeps its existing access. Mirrors server/src/common/permissions.ts.
 */
export function isRestrictedStaff(roles: Roles): boolean {
  if (isSuperAdmin(roles)) return false;
  return roles.includes("admin") || isSubAdmin(roles) || isAgent(roles);
}

/** Where an account lands after login. */
export function homeFor(roles: Roles): string {
  if (canUseAdminDashboard(roles)) return "/admin";
  if (isAgent(roles)) return "/agent";
  return "/profile";
}

/** A `?next=` target is honoured only when it is inside the account's own area. */
export function resolveNext(roles: Roles, next: string | null): string {
  const home = homeFor(roles);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  if (canUseAdminDashboard(roles) && !isSuperAdmin(roles)) return next.startsWith("/admin") ? next : home;
  if (isAgent(roles) && !isSuperAdmin(roles)) return next.startsWith("/agent") ? next : home;
  if (next.startsWith("/admin") && !canUseAdminDashboard(roles)) return home;
  if (next.startsWith("/agent")) return home;
  return next;
}

export function roleLabel(roles: Roles): string {
  if (isSuperAdmin(roles)) return "Super Admin";
  if (roles.includes("admin")) return "Admin";
  if (isSubAdmin(roles)) return "Sub Admin";
  if (isAgent(roles)) return "Agent";
  return "Player";
}

/** Sections of the Admin Dashboard a Sub Admin can open, by permission. */
export const SUB_ADMIN_SECTIONS: { href: string; permission: string }[] = [
  { href: "/admin/deposits", permission: "deposits.view" },
  { href: "/admin/deposit-numbers", permission: "deposits.view" },
  { href: "/admin/withdrawals", permission: "withdrawals.view" },
  { href: "/admin/transactions", permission: "transactions.view" },
  { href: "/admin/bonuses", permission: "transactions.view" },
];
