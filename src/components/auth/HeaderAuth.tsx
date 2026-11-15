"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { canUseAdminDashboard, homeFor, isAgent, isRestrictedStaff, roleLabel } from "@/lib/roles";
import { useWalletBalance } from "@/components/wallet/WalletBalanceProvider";
import { formatBdt } from "@/lib/money";

/** Wallet balance from the backend; a placeholder until the first read lands. */
function BalanceTag({ balance, className }: { balance: number | null; className?: string }) {
  return (
    <span
      className={cn("tabular-nums font-bold text-tcl-gold", balance === null && "text-tcl-muted", className)}
      aria-label={balance === null ? "Wallet balance loading" : `Wallet balance ${formatBdt(balance)}`}
    >
      {balance === null ? "৳ —" : formatBdt(balance)}
    </span>
  );
}

interface HeaderAuthProps {
  variant: "desktop" | "mobile";
}

/**
 * Logged-out: Log In / Sign Up buttons (same visual as before).
 * Logged-in: user chip with first name + role badge, link to /profile, logout.
 */
export function HeaderAuth({ variant }: HeaderAuthProps) {
  const { user, loading, logout } = useAuth();
  const { balance } = useWalletBalance();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  if (!user) {
    if (variant === "desktop") {
      return (
        <>
          <SecondaryButton variant="outline" size="md" shape="rect" href="/login">
            Log In
          </SecondaryButton>
          <PrimaryButton size="md" shape="rect" href="/signup">
            Sign Up
          </PrimaryButton>
        </>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pb-3">
        <SecondaryButton variant="outline" size="md" shape="rect" fullWidth href="/login">
          Log In
        </SecondaryButton>
        <PrimaryButton size="md" shape="rect" fullWidth href="/signup">
          Sign Up
        </PrimaryButton>
      </div>
    );
  }

  const isAdmin = canUseAdminDashboard(user.roles) || isAgent(user.roles);
  // Admin, Sub Admin and Agent accounts have no profile: their chip and menu
  // lead to their dashboard instead.
  const staff = isRestrictedStaff(user.roles);
  const accountHref = staff ? homeFor(user.roles) : "/profile";
  const dashboardHref = isAgent(user.roles) && !canUseAdminDashboard(user.roles) ? "/agent" : "/admin";
  const dashboardLabel = dashboardHref === "/agent" ? "Agent Dashboard" : "Admin Dashboard";
  const badge = roleLabel(user.roles);
  const isVip = user.roles.includes("vip");
  // Players see "username ৳balance"; staff accounts have no wallet.
  const showBalance = !staff;
  const chipLabel = showBalance ? user.username : user.firstName || user.username;

  if (variant === "desktop") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 items-center gap-2 rounded-pill border border-tcl-gold/40 bg-tcl-surface-2 px-3 text-sm font-semibold text-tcl-white transition-colors hover:border-tcl-gold cursor-pointer"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-tcl-gold/20 text-tcl-gold">
            <ICONS.User aria-hidden="true" className="size-3.5" />
          </span>
          <span className="max-w-[10rem] truncate">{chipLabel}</span>
          {showBalance ? (
            <>
              <span aria-hidden="true" className="h-4 w-px bg-tcl-border-muted" />
              <BalanceTag balance={balance} />
            </>
          ) : null}
          {isAdmin ? (
            <span className="rounded-pill bg-tcl-red/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-red-bright">{badge}</span>
          ) : isVip ? (
            <span className="rounded-pill bg-tcl-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-gold">VIP</span>
          ) : null}
          <ICONS.ChevronDown aria-hidden="true" className={cn("size-3.5 text-tcl-muted transition-transform", open && "rotate-180")} />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-11 w-48 overflow-hidden rounded-md border border-tcl-border-muted bg-tcl-surface-1 shadow-lg"
          >
            {staff ? null : (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-tcl-white hover:bg-tcl-surface-2"
                role="menuitem"
              >
                My Profile
              </Link>
            )}
            {isAdmin ? (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-tcl-white hover:bg-tcl-surface-2"
                role="menuitem"
              >
                {dashboardLabel}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="block w-full border-t border-tcl-border-muted px-3 py-2 text-left text-sm text-tcl-red-bright hover:bg-tcl-surface-2 disabled:opacity-50 cursor-pointer"
              role="menuitem"
            >
              {loading ? "Logging out…" : "Log Out"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  // Mobile — compact row inside the header's lower band
  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      <Link
        href={accountHref}
        className="flex h-11 flex-1 items-center gap-2 rounded-md border border-tcl-gold/40 bg-tcl-surface-2 px-3 text-sm font-semibold text-tcl-white"
      >
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-tcl-gold/20 text-tcl-gold">
          <ICONS.User aria-hidden="true" className="size-3.5" />
        </span>
        <span className="min-w-0 truncate">{chipLabel}</span>
        {showBalance ? <BalanceTag balance={balance} className="ml-auto shrink-0" /> : null}
        {isAdmin ? (
          <span className="ml-auto rounded-pill bg-tcl-red/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-red-bright">{badge}</span>
        ) : isVip ? (
          <span className="ml-auto rounded-pill bg-tcl-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-gold">VIP</span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Log out"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-tcl-border-muted bg-tcl-surface-2 text-tcl-red-bright hover:border-tcl-red/60 disabled:opacity-50 cursor-pointer"
      >
        <ICONS.LogOut aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
