"use client";

import { useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import type { SessionUser } from "@/components/auth/AuthProvider";

const TABS = [
  { key: "ongoing", label: BN.userCenter.missionOngoing },
  { key: "upcoming", label: BN.userCenter.missionUpcoming },
  { key: "finished", label: BN.userCenter.missionCompleted },
] as const;

const INNER = [
  { key: "milestones", label: BN.userCenter.missionMilestones },
  { key: "rules", label: BN.userCenter.missionRules },
] as const;

const MILESTONES = [
  { target: 1500, bonus: 3 },
  { target: 5000, bonus: 6 },
  { target: 12000, bonus: 9 },
  { target: 30000, bonus: 18 },
];

export function MissionsClient({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ongoing");
  const [inner, setInner] = useState<(typeof INNER)[number]["key"]>("milestones");

  return (
    <UserCenterShell title={BN.userCenter.mission}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-6 border-b border-tcl-border-muted pb-2">
          <div className="flex gap-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold",
                  tab === t.key
                    ? "border-tcl-red-bright text-tcl-red-bright"
                    : "border-transparent text-tcl-muted hover:text-tcl-white",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-4">
            {INNER.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setInner(t.key)}
                className={cn(
                  "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold",
                  inner === t.key
                    ? "border-tcl-red-bright text-tcl-red-bright"
                    : "border-transparent text-tcl-muted hover:text-tcl-white",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
          {/* Account summary card */}
          <NeonCard className="bg-gradient-to-br from-purple-600 to-pink-700 text-white">
            <div className="flex items-start justify-between">
              <p className="font-display text-xl text-white">
                {user.username}
              </p>
              <button
                type="button"
                className="rounded-full p-1 text-white/70 hover:text-white"
                aria-label={BN.userCenter.refreshBalance}
              >
                <ICONS.History aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="mt-4 rounded-md border border-white/20 bg-white/10 p-3 text-center">
              <p className="text-[11px] uppercase text-white/70">প্রাপ্ত হিসাব</p>
              <p className="font-display text-3xl text-white">৳ 0.00</p>
            </div>

            <div className="mt-4 rounded-md border border-white/20 bg-white/5 p-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-tcl-gold to-amber-700">
                  <ICONS.Award
                    aria-hidden="true"
                    className="size-5 text-white"
                  />
                </span>
                <div>
                  <p className="font-semibold text-white">
                    {BN.userCenter.slotMissionBonus}
                  </p>
                  <p className="text-[10px] text-white/70">
                    তারিখ: ২০২৬-১১-১০-২০২৬-১১-১১
                  </p>
                  <p className="text-[10px] text-white/70">অবশিষ্ট: 10:39:30</p>
                  <p className="text-[10px] text-white/70">
                    {BN.userCenter.missionMilestones}: 0/12
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-0 rounded-full bg-tcl-gold" />
              </div>
              <p className="mt-1 text-right text-[10px] text-white/70">0 %</p>
            </div>
          </NeonCard>

          {/* Milestone list */}
          <NeonCard className="space-y-3">
            <p className="text-caption font-semibold text-tcl-white">
              {BN.userCenter.slotMissionBonus}
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-tcl-red/20 px-2 py-0.5 text-[11px] text-tcl-red-bright">
                <ICONS.Flame aria-hidden="true" className="size-3" />
                {BN.userCenter.incompleteMilestones} (12)
              </span>
            </p>
            <ul className="space-y-3">
              {MILESTONES.map((m, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-tcl-border-muted bg-tcl-black text-tcl-gold">
                    <ICONS.Target
                      aria-hidden="true"
                      className="size-4"
                    />
                  </span>
                  <div className="flex-1">
                    <p className="text-caption text-tcl-white">
                      {BN.userCenter.validBetProgress}{" "}
                      <span className="text-tcl-white/80">
                        ৳ 0.00/{m.target.toLocaleString()}.00
                      </span>
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 overflow-hidden rounded-full bg-tcl-black/60">
                        <div className="h-1.5 w-0 bg-tcl-gold" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-tcl-info/10 px-2 py-0.5 text-[11px] text-tcl-info">
                        <ICONS.Gift aria-hidden="true" className="size-3" />
                        {BN.userCenter.bonus}: ৳ {m.bonus.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </NeonCard>
        </div>
      </div>
    </UserCenterShell>
  );
}
