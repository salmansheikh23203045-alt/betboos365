"use client";

import { useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import type { SessionUser } from "@/components/auth/AuthProvider";

const TOP_TABS = [
  { key: "summary", label: BN.userCenter.inviteSummary },
  { key: "rewards", label: BN.userCenter.inviteRewards },
  { key: "income", label: BN.userCenter.inviteIncome },
  { key: "record", label: BN.userCenter.inviteRecord },
  { key: "list", label: BN.userCenter.inviteList },
] as const;

export function InviteFriendsClient({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<(typeof TOP_TABS)[number]["key"]>("summary");
  const referralCode = `gxp${user.username.slice(0, 4)}`;
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?r=${referralCode}`
      : `/signup?r=${referralCode}`;
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <UserCenterShell title={BN.userCenter.inviteFriends}>
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-tcl-border-muted pb-2">
          {TOP_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold",
                tab === t.key
                  ? "border-tcl-gold text-tcl-gold"
                  : "border-transparent text-tcl-muted hover:text-tcl-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "summary" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <NeonCard className="bg-gradient-to-br from-indigo-500 to-blue-700 text-white">
                <div className="flex items-start gap-3">
                  <ICONS.Trophy
                    aria-hidden="true"
                    className="size-10 text-tcl-gold"
                  />
                  <div className="flex-1">
                    <p className="font-display text-xl italic text-white">
                      {BN.userCenter.monthlyGoal}
                    </p>
                    <p className="text-caption text-white/80">
                      লক্ষ্য পূরণের আগে আরও 9999 জনকে আমন্ত্রণ জানান
                    </p>
                  </div>
                </div>
              </NeonCard>

              <NeonCard>
                <p className="mb-2 text-caption text-tcl-white">
                  {BN.userCenter.topEarners}
                </p>
                <ul className="space-y-2">
                  {[
                    { rank: "1st", id: "17****1", amount: 123214411 },
                    { rank: "2nd", id: "yo****7", amount: 1096613 },
                    { rank: "3rd", id: "17****7", amount: 306528 },
                  ].map((r) => (
                    <li
                      key={r.rank}
                      className="flex items-center justify-between rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm text-tcl-gold">
                          {r.rank}
                        </span>
                        <ICONS.User
                          aria-hidden="true"
                          className="size-5 text-tcl-muted"
                        />
                        <span className="text-caption text-tcl-white">
                          {r.id}
                        </span>
                      </div>
                      <span className="text-caption font-semibold text-tcl-gold">
                        ৳ {r.amount.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </NeonCard>

              <NeonCard>
                <p className="mb-2 text-caption text-tcl-white">
                  {BN.userCenter.rewardsReceived}
                </p>
                <ul className="grid grid-cols-2 gap-2 text-center">
                  {[
                    {
                      icon: "Star" as const,
                      label: BN.userCenter.inviteReward,
                      amount: 14326317,
                      claims: 36810,
                    },
                    {
                      icon: "Award" as const,
                      label: BN.userCenter.successReward,
                      amount: 306738,
                      claims: 6740,
                    },
                    {
                      icon: "ArrowDownCircle" as const,
                      label: BN.userCenter.depositRebate,
                      amount: 5259898.36,
                      claims: 92556,
                    },
                    {
                      icon: "Trophy" as const,
                      label: BN.userCenter.bonusRebate,
                      amount: 16921709.39,
                      claims: 165968,
                    },
                  ].map((t) => {
                    const Icon = ICONS[t.icon];
                    return (
                      <li
                        key={t.label}
                        className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3"
                      >
                        <Icon
                          aria-hidden="true"
                          className="mx-auto mb-1 size-5 text-tcl-gold"
                        />
                        <p className="text-[11px] text-tcl-muted">
                          {t.label}
                        </p>
                        <p className="font-display text-sm uppercase text-tcl-white">
                          ৳ {t.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-tcl-muted">
                          {t.claims.toLocaleString()} দাবিত
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </NeonCard>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NeonCard className="bg-gradient-to-br from-rose-300 to-rose-500 text-center text-white">
                  <p className="text-[11px] uppercase">
                    {BN.userCenter.todayIncome}
                  </p>
                  <p className="font-display text-xl uppercase">৳ 0.00</p>
                </NeonCard>
                <NeonCard className="bg-gradient-to-br from-sky-400 to-indigo-600 text-center text-white">
                  <p className="text-[11px] uppercase">
                    {BN.userCenter.monthIncome}
                  </p>
                  <p className="font-display text-xl uppercase">৳ 0.00</p>
                </NeonCard>
                <NeonCard className="bg-gradient-to-br from-purple-400 to-purple-700 text-center text-white">
                  <p className="text-[11px] uppercase">
                    {BN.userCenter.pendingReferral}
                  </p>
                  <p className="font-display text-xl uppercase">0</p>
                </NeonCard>
                <NeonCard className="bg-gradient-to-br from-cyan-400 to-blue-600 text-center text-white">
                  <p className="text-[11px] uppercase">
                    {BN.userCenter.qualifiedReferral}
                  </p>
                  <p className="font-display text-xl uppercase">0</p>
                </NeonCard>
              </div>

              <NeonCard className="space-y-3 text-center">
                <p className="text-caption text-tcl-white">
                  বন্ধুদের শেয়ার করুন
                </p>
                <div className="mx-auto flex size-28 items-center justify-center rounded-md border border-tcl-border-muted bg-tcl-surface-2">
                  <ICONS.Camera
                    aria-hidden="true"
                    className="size-10 text-tcl-muted"
                  />
                </div>
                <div className="space-y-1 text-[11px] text-tcl-muted">
                  <p>
                    {BN.referral.yourCode}:{" "}
                    <button
                      type="button"
                      onClick={() => copy(referralCode, "code")}
                      className="font-semibold text-tcl-gold hover:underline"
                    >
                      {referralCode}
                    </button>{" "}
                    {copied === "code" ? (
                      <span className="text-tcl-success">
                        {BN.common.copied}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate">
                    <button
                      type="button"
                      onClick={() => copy(referralLink, "link")}
                      className="text-tcl-white hover:underline"
                    >
                      {referralLink}
                    </button>{" "}
                    {copied === "link" ? (
                      <span className="text-tcl-success">
                        {BN.common.copied}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1 text-tcl-white">
                  {(["Share2", "User", "Send", "MessageCircle", "Mail", "Music2", "Globe"] as const).map(
                    (n, i) => {
                      const Icon = ICONS[n];
                      return (
                        <button
                          key={i}
                          type="button"
                          className="flex size-9 items-center justify-center rounded-full bg-tcl-surface-2 text-tcl-muted hover:text-tcl-gold"
                          aria-label={`share-${n}`}
                        >
                          <Icon aria-hidden="true" className="size-4" />
                        </button>
                      );
                    },
                  )}
                </div>
              </NeonCard>

              <NeonCard className="space-y-2">
                <p className="text-caption text-tcl-white">
                  {BN.referral.howItWorks}
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-[11px] text-tcl-muted">
                  <li>{BN.referral.step1}</li>
                  <li>{BN.referral.step2}</li>
                  <li>{BN.referral.step3}</li>
                </ol>
                <p className="text-[11px] text-tcl-red-bright">
                  {BN.referral.comingSoonBody}
                </p>
              </NeonCard>
            </div>
          </div>
        ) : (
          <NeonCard>
            <p className="py-20 text-center text-tcl-muted">
              {BN.userCenter.noData}
            </p>
          </NeonCard>
        )}
      </div>
    </UserCenterShell>
  );
}
