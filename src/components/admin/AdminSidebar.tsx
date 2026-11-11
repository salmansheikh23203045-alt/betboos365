"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { SessionUser } from "@/components/auth/AuthProvider";
import { BN } from "@/i18n/bn";

interface NavEntry {
  label: string;
  href: string;
  icon: IconName;
  requires?: "super_admin";
}

// Exact order from the reference image. Label "Admin" is deliberate — not
// "Admin & Staff" per the user's explicit instruction.
const NAV: NavEntry[] = [
  { label: BN.admin.overview, href: "/admin", icon: "House" },
  { label: BN.admin.userManagement, href: "/admin/users", icon: "Users" },
  { label: BN.admin.adminMgmt, href: "/admin/admins", icon: "ShieldCheck", requires: "super_admin" },
  { label: BN.admin.rolesPermissions, href: "/admin/roles", icon: "Shield", requires: "super_admin" },
  { label: BN.admin.gamesProviders, href: "/admin/games", icon: "Gamepad2" },
  { label: BN.admin.sportsMatches, href: "/admin/sports", icon: "Trophy" },
  { label: BN.admin.promotions, href: "/admin/promotions", icon: "Gift" },
  { label: BN.admin.transactions, href: "/admin/transactions", icon: "History" },
  { label: BN.admin.walletFinance, href: "/admin/finance", icon: "Wallet" },
  { label: BN.admin.supportTickets, href: "/admin/support", icon: "MessageCircle" },
  { label: BN.admin.reports, href: "/admin/reports", icon: "TrendingUp" },
  { label: BN.admin.auditLogs, href: "/admin/audit-logs", icon: "BookOpen" },
  { label: BN.admin.systemSettings, href: "/admin/settings", icon: "Settings" },
];

export function AdminSidebar({
  user,
  isSuperAdmin,
  mobileOpen,
  onCloseMobile,
}: {
  user: SessionUser;
  isSuperAdmin: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const roleLabel = isSuperAdmin ? "Super Admin" : "Admin";

  // Super-admin-only items are HIDDEN from plain admins — the admin
  // controller still rejects them on the backend, but hiding avoids UI
  // dead links.
  const visibleNav = NAV.filter((n) => !n.requires || n.requires === "super_admin" ? (n.requires ? isSuperAdmin : true) : true);

  const content = (
    <aside className="flex h-full w-72 flex-col border-r border-tcl-red/30 bg-tcl-black">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-tcl-border-muted px-5 py-5">
        <div className="relative">
          <ICONS.Crown aria-hidden="true" className="size-8 text-tcl-gold" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-heading-md uppercase text-tcl-white">TCL11</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-tcl-red-bright">
            {roleLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-tcl-muted hover:text-tcl-white lg:hidden cursor-pointer"
          aria-label="Close menu"
        >
          <ICONS.X aria-hidden="true" className="size-5" />
        </button>
      </div>

      {/* Role card */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-md border border-tcl-red/40 bg-gradient-to-r from-tcl-red/20 to-tcl-red/5 px-3 py-2.5 shadow-[0_0_20px_rgba(220,38,38,0.25)]">
          <ICONS.Crown aria-hidden="true" className="size-5 text-tcl-gold" />
          <span className="font-semibold text-tcl-white">{roleLabel}</span>
          <ICONS.ChevronRight aria-hidden="true" className="ml-auto size-4 text-tcl-muted" />
        </div>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-tcl-red/20 text-tcl-red-bright shadow-[inset_3px_0_0_0_var(--color-tcl-red-bright)]"
                      : "text-tcl-muted hover:bg-tcl-surface-2 hover:text-tcl-white",
                  )}
                >
                  <Icon aria-hidden="true" className={cn("size-4.5 shrink-0", active ? "text-tcl-red-bright" : "text-tcl-muted group-hover:text-tcl-white")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer card */}
      <div className="border-t border-tcl-border-muted px-4 py-4">
        <div className="rounded-md border border-tcl-red/30 bg-tcl-surface-2 p-3 text-center">
          <ICONS.Crown aria-hidden="true" className="mx-auto mb-1 size-5 text-tcl-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-tcl-white">TCL11</p>
          <p className="text-[10px] text-tcl-muted">{roleLabel} Panel</p>
          <p className="mt-1 text-[10px] text-tcl-muted">v1.0.0</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: static */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{content}</div>

      {/* Mobile: drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-y-0 left-0 w-72">{content}</div>
        </div>
      ) : null}
    </>
  );
}
