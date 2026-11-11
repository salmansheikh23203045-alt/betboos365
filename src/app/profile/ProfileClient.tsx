"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { VIPProgressCard } from "@/components/vip/VIPProgressCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { VIP_STATUS } from "@/data/mock";
import type { SessionUser } from "@/components/auth/AuthProvider";
import { DepositModal } from "@/components/wallet/DepositModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { TransactionList } from "@/components/wallet/TransactionList";
import { fetchMyWallet } from "@/lib/wallet-client";
import type { WalletView } from "@/types/wallet";

import { BN } from "@/i18n/bn";

const TABS = [
  { key: "Overview" as const, label: BN.profile.overview },
  { key: "Transactions" as const, label: BN.profile.transactions },
  { key: "Settings" as const, label: BN.profile.settings },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export interface ProfileData {
  userId: string;
  displayName: string;
  avatarUrl: string;
  preferredCurrency: string;
  language: string;
  timezone: string;
  vipLevel: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeBonuses: number;
  gamesPlayed: number;
  createdAt: string;
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

function WalletBalanceCard({
  wallet,
  loading,
  onDeposit,
  onWithdraw,
}: {
  wallet: WalletView | null;
  loading: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  return (
    <NeonCard className="space-y-4">
      <SectionHeading title={BN.nav.deposit + " / " + BN.nav.withdraw} icon="Wallet" />
      {loading && !wallet ? (
        <div className="flex items-center justify-center py-6 text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="size-5 animate-spin" />
        </div>
      ) : wallet ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-tcl-gold/40 bg-gradient-to-b from-tcl-gold/10 to-transparent p-4">
            <p className="text-caption uppercase tracking-wider text-tcl-muted">
              {BN.wallet.availableBalance}
            </p>
            <p className="font-display text-heading-lg uppercase text-tcl-gold leading-none">
              {wallet.currency} {wallet.availableBalance.toLocaleString()}
            </p>
            {wallet.reservedBalance > 0 ? (
              <p className="mt-1 text-[11px] text-tcl-muted">
                {wallet.currency} {wallet.reservedBalance.toLocaleString()} পেন্ডিং উত্তোলনের জন্য সংরক্ষিত।
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton onClick={onDeposit} size="md" icon="ArrowDownCircle" fullWidth>
              {BN.nav.deposit}
            </PrimaryButton>
            <SecondaryButton onClick={onWithdraw} size="md" icon="ArrowUpCircle" fullWidth>
              {BN.nav.withdraw}
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <p className="text-caption text-tcl-muted">
          Wallet unavailable — reload to retry.
        </p>
      )}
    </NeonCard>
  );
}

function OverviewTab({
  profile,
  wallet,
  walletLoading,
  onDeposit,
  onWithdraw,
}: {
  profile: ProfileData | null;
  wallet: WalletView | null;
  walletLoading: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const currency = wallet?.currency ?? profile?.preferredCurrency ?? "BDT";
  const stats = [
    {
      label: BN.profile.totalDeposits,
      value: profile ? formatMoney(profile.totalDeposits, currency) : "—",
      icon: "ArrowDownCircle" as const,
    },
    {
      label: BN.profile.totalWithdrawals,
      value: profile ? formatMoney(profile.totalWithdrawals, currency) : "—",
      icon: "ArrowUpCircle" as const,
    },
    {
      label: BN.profile.activeBonuses,
      value: profile ? String(profile.activeBonuses) : "—",
      icon: "Gift" as const,
    },
    {
      label: BN.profile.gamesPlayed,
      value: profile ? String(profile.gamesPlayed) : "—",
      icon: "Gamepad2" as const,
    },
  ];
  return (
    <div className="animate-tab-fade grid items-start gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <WalletBalanceCard
          wallet={wallet}
          loading={walletLoading}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
        />
        <VIPProgressCard status={VIP_STATUS} />
      </div>
      <NeonCard className="space-y-3">
        <SectionHeading title={BN.profile.quickStats} icon="TrendingUp" />
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = ICONS[stat.icon];
            return (
              <div
                key={stat.label}
                className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3 text-center transition-colors hover:border-tcl-gold/40"
              >
                <Icon aria-hidden="true" className="mx-auto mb-1 size-5 text-tcl-gold" />
                <p className="text-heading-sm font-bold text-tcl-white">{stat.value}</p>
                <p className="text-[11px] text-tcl-muted">{stat.label}</p>
              </div>
            );
          })}
        </div>
        {!profile ? (
          <p className="pt-1 text-caption text-tcl-muted">
            লাইভ ডেটা লোড হয়নি — প্লেসহোল্ডার দেখানো হচ্ছে। রিলোড করে আবার চেষ্টা করুন।
          </p>
        ) : null}
      </NeonCard>
    </div>
  );
}

function SettingsTab({
  user,
  profile,
}: {
  user: SessionUser;
  profile: ProfileData | null;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? `${user.firstName} ${user.lastName}`);
  const [phone, setPhone] = useState(""); // Phone is on the User, not Profile — not editable here yet.
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg?: string }>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Save failed" }))) as { message?: string };
        setStatus({ kind: "err", msg: body.message ?? "Save failed" });
      } else {
        setStatus({ kind: "ok", msg: "Profile saved." });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NeonCard className="animate-tab-fade space-y-4">
      <SectionHeading title="Account Settings" icon="Settings" />
      {status.kind !== "idle" ? (
        <div
          role="status"
          className={cn(
            "rounded-md px-3 py-2 text-caption",
            status.kind === "ok"
              ? "border border-tcl-success/40 bg-tcl-success/10 text-tcl-success"
              : "border border-tcl-red/40 bg-tcl-red/10 text-tcl-red-bright",
          )}
        >
          {status.msg}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="prf-name" className="text-caption font-semibold text-tcl-white">
            Display Name
          </label>
          <div className="relative">
            <ICONS.User aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            <input
              id="prf-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Player123"
              disabled={saving}
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="prf-username" className="text-caption font-semibold text-tcl-white">
            Username
          </label>
          <div className="relative">
            <ICONS.User aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            <input
              id="prf-username"
              type="text"
              value={user.username}
              readOnly
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-1 pl-10 pr-4 text-sm text-tcl-muted"
            />
          </div>
          <p className="text-[11px] text-tcl-muted">Username cannot be changed from this screen.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="prf-email" className="text-caption font-semibold text-tcl-white">
            Email <span className="text-tcl-muted">(optional)</span>
          </label>
          <div className="relative">
            <ICONS.Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            <input
              id="prf-email"
              type="email"
              value={user.email ?? ""}
              readOnly
              placeholder="No email on file"
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-1 pl-10 pr-4 text-sm text-tcl-muted"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="prf-phone" className="text-caption font-semibold text-tcl-white">
            Phone
          </label>
          <div className="relative">
            <ICONS.Phone aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            <input
              id="prf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Current phone on file"
              disabled
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-1 pl-10 pr-4 text-sm text-tcl-muted"
            />
          </div>
          <p className="text-[11px] text-tcl-muted">Phone edit is planned for a later step.</p>
        </div>
        <SecondaryButton type="submit" size="md" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </SecondaryButton>
      </form>
    </NeonCard>
  );
}

export function ProfileClient({
  user,
  profile,
}: {
  user: SessionUser;
  profile: ProfileData | null;
}) {
  const [tab, setTab] = useState<TabKey>("Overview");
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [txRefresh, setTxRefresh] = useState(0);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    const res = await fetchMyWallet();
    if (res.ok) setWallet(res.data);
    setWalletLoading(false);
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleSubmitted = () => {
    setTxRefresh((n) => n + 1);
    loadWallet();
  };

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-tcl-gold bg-tcl-surface-2">
          <ICONS.User aria-hidden="true" className="size-8 text-tcl-gold" />
        </div>
        <div>
          <h1 className="font-display text-heading-lg uppercase text-tcl-white">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-caption text-tcl-muted">
            @{user.username} · Member since{" "}
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-tcl-border-muted pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 px-4 pb-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
              t.key === tab ? "border-tcl-gold text-tcl-gold" : "border-transparent text-tcl-muted hover:text-tcl-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab
          key="overview"
          profile={profile}
          wallet={wallet}
          walletLoading={walletLoading}
          onDeposit={() => setDepositOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />
      )}
      {tab === "Transactions" && <TransactionList key="transactions" refreshKey={txRefresh} />}
      {tab === "Settings" && <SettingsTab key="settings" user={user} profile={profile} />}

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSubmitted={handleSubmitted}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
