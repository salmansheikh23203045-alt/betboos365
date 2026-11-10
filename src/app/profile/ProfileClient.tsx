"use client";

import { useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { VIPProgressCard } from "@/components/vip/VIPProgressCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { VIP_STATUS, TRANSACTIONS } from "@/data/mock";
import type { SessionUser } from "@/components/auth/AuthProvider";

const TABS = ["Overview", "Transactions", "Settings"] as const;

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

function OverviewTab({ profile }: { profile: ProfileData | null }) {
  // VIP progress stays on mock data — there is no backend endpoint for tier
  // progress/points yet. Quick stats come from the real profile row.
  const currency = profile?.preferredCurrency ?? "USD";
  const stats = [
    {
      label: "Total Deposits",
      value: profile ? formatMoney(profile.totalDeposits, currency) : "—",
      icon: "Wallet" as const,
    },
    {
      label: "Total Withdrawals",
      value: profile ? formatMoney(profile.totalWithdrawals, currency) : "—",
      icon: "ArrowRight" as const,
    },
    {
      label: "Active Bonuses",
      value: profile ? String(profile.activeBonuses) : "—",
      icon: "Gift" as const,
    },
    {
      label: "Games Played",
      value: profile ? String(profile.gamesPlayed) : "—",
      icon: "Gamepad2" as const,
    },
  ];
  return (
    <div className="animate-tab-fade grid items-start gap-4 lg:grid-cols-2">
      <VIPProgressCard status={VIP_STATUS} />
      <NeonCard className="space-y-3">
        <SectionHeading title="Quick Stats" icon="TrendingUp" />
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
            Live stats unavailable — showing placeholders. Reload to retry.
          </p>
        ) : null}
      </NeonCard>
    </div>
  );
}

function TransactionsTab() {
  // There is no transactions endpoint on the backend yet; this view stays
  // on mock data per the Step 09 scope note.
  return (
    <NeonCard className="animate-tab-fade space-y-3">
      <SectionHeading title="Transaction History" icon="Clock" />
      <p className="text-caption text-tcl-muted">
        Sample history shown — a live transactions endpoint is planned for a later step.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
              <th className="pb-2 pr-4 font-semibold">ID</th>
              <th className="pb-2 pr-4 font-semibold">Type</th>
              <th className="pb-2 pr-4 font-semibold">Amount</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-tcl-border-muted/50 transition-colors hover:bg-tcl-surface-2/50 last:border-0"
              >
                <td className="py-2.5 pr-4 text-tcl-muted">{tx.userId}</td>
                <td className="py-2.5 pr-4 text-tcl-white">{tx.type}</td>
                <td className="py-2.5 pr-4 font-semibold text-tcl-gold">
                  {tx.currency} {tx.amount.toFixed(2)}
                </td>
                <td className="py-2.5">
                  <span
                    className={cn(
                      "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase",
                      tx.status === "SUCCESS" || tx.status === "WIN"
                        ? "bg-tcl-success/20 text-tcl-success"
                        : "bg-tcl-red/20 text-tcl-red-bright",
                    )}
                  >
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NeonCard>
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
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

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
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 pb-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
              t === tab ? "border-tcl-gold text-tcl-gold" : "border-transparent text-tcl-muted hover:text-tcl-white",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab key="overview" profile={profile} />}
      {tab === "Transactions" && <TransactionsTab key="transactions" />}
      {tab === "Settings" && <SettingsTab key="settings" user={user} profile={profile} />}
    </div>
  );
}
