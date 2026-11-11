"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type SessionUser } from "@/components/auth/AuthProvider";
import { UserInfoCard } from "./UserInfoCard";
import { ICONS, type IconName } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { fetchMyWallet } from "@/lib/wallet-client";
import type { WalletView } from "@/types/wallet";

interface Shortcut {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
  action?: "logout";
}

function buildShortcuts(): Shortcut[] {
  return [
    { label: BN.userCenter.myRewards, href: "/profile/rewards", icon: "Trophy", badge: 1 },
    { label: BN.userCenter.bettingHistory, href: "/profile/betting", icon: "History" },
    { label: BN.userCenter.profitAndLoss, href: "/profile/pnl", icon: "TrendingUp" },
    { label: BN.userCenter.depositRecord, href: "/profile/records?tab=deposit", icon: "ArrowDownCircle" },
    { label: BN.userCenter.withdrawRecord, href: "/profile/records?tab=withdraw", icon: "ArrowUpCircle" },
    { label: BN.userCenter.transactionHistory, href: "/profile/records", icon: "BookOpen" },
    { label: BN.userCenter.myAccount, href: "/profile", icon: "User" },
    { label: BN.userCenter.securityCenter, href: "/profile", icon: "Shield" },
    { label: BN.userCenter.inviteFriends, href: "/profile/invite", icon: "Users" },
    { label: BN.userCenter.mission, href: "/profile/missions", icon: "Gift", badge: 1 },
    { label: BN.userCenter.mail, href: "/profile/messages", icon: "Mail" },
    { label: BN.userCenter.suggestion, href: "/contact", icon: "MessageCircle" },
    { label: BN.userCenter.downloadApp, href: "/", icon: "Smartphone" },
    { label: BN.userCenter.customerService, href: "/chat", icon: "Headset" },
    { label: BN.userCenter.logout, href: "#logout", icon: "LogOut", action: "logout" },
  ];
}

export function MobileProfileHome({ user }: { user: SessionUser }) {
  const auth = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = useCallback(async () => {
    setRefreshing(true);
    const res = await fetchMyWallet();
    if (res.ok) setWallet(res.data);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function handleLogout() {
    await auth.logout();
    router.replace("/login");
  }

  const shortcuts = buildShortcuts();

  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-md space-y-4 px-3 pb-6 pt-3">
      <UserInfoCard
        user={user}
        wallet={wallet}
        joinedOn={null}
        onRefresh={loadWallet}
        refreshing={refreshing}
        variant="mobile"
      />

      {/* Three action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/profile/deposit"
          className="rounded-full border border-tcl-border-muted bg-tcl-surface-2 py-2.5 text-center text-caption font-semibold text-tcl-white tap-feedback hover-glow-red"
        >
          {BN.userCenter.submitDeposit}
        </Link>
        <Link
          href="/profile/withdraw"
          className="rounded-full border border-tcl-border-muted bg-tcl-surface-2 py-2.5 text-center text-caption font-semibold text-tcl-white tap-feedback hover-glow-red"
        >
          {BN.userCenter.withdraw}
        </Link>
        <Link
          href="/profile/records"
          className="rounded-full border border-tcl-border-muted bg-tcl-surface-2 py-2.5 text-center text-caption font-semibold text-tcl-white tap-feedback hover-glow-red"
        >
          {BN.userCenter.myCard}
        </Link>
      </div>

      {/* Member center grid */}
      <section className="rounded-card border border-tcl-border-muted bg-tcl-surface-1 p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-0.5 text-caption uppercase tracking-wide text-tcl-gold">
            {BN.userCenter.memberCenter}
          </span>
          <span className="h-px flex-1 bg-tcl-border-muted" />
        </div>

        <ul className="grid grid-cols-4 gap-y-4 gap-x-2">
          {shortcuts.map((s) => {
            const Icon = ICONS[s.icon];
            const content = (
              <div className="relative flex flex-col items-center gap-1.5 text-center">
                <div className="relative">
                  <span className="flex size-12 items-center justify-center rounded-full border border-tcl-gold/40 bg-gradient-to-br from-tcl-gold/20 to-tcl-surface-2 text-tcl-gold shadow-[0_0_14px_rgba(255,215,0,0.15)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  {s.badge ? (
                    <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-tcl-red text-[10px] font-bold text-white">
                      {s.badge}
                    </span>
                  ) : null}
                </div>
                <span className="line-clamp-2 text-[11px] leading-tight text-tcl-white/90">
                  {s.label}
                </span>
              </div>
            );
            if (s.action === "logout") {
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full tap-feedback"
                  >
                    {content}
                  </button>
                </li>
              );
            }
            return (
              <li key={s.label}>
                <Link href={s.href} className="block tap-feedback">
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
