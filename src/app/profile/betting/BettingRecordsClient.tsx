"use client";

import { useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

const CATEGORIES = [
  { key: "all", label: BN.userCenter.allTab },
  { key: "slot", label: BN.userCenter.slotTab },
  { key: "fishing", label: BN.userCenter.fishingTab },
  { key: "live", label: BN.userCenter.liveTab },
  { key: "sports", label: BN.userCenter.sportsTab },
  { key: "poker", label: BN.userCenter.pokerTab },
  { key: "lottery", label: BN.userCenter.lotteryTab },
] as const;

const DATE_FILTERS = [
  { key: "today", label: BN.userCenter.today },
  { key: "yesterday", label: BN.userCenter.yesterday },
  { key: "seven", label: BN.userCenter.sevenDays },
  { key: "custom", label: BN.userCenter.customRange },
] as const;

const COLUMNS = [
  BN.userCenter.betAmount,
  BN.userCenter.betAmount,
  BN.userCenter.validBet,
  BN.userCenter.reward,
  BN.userCenter.profitLossCol,
  BN.userCenter.gameName,
  BN.userCenter.gameCount,
];

export function BettingRecordsClient() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [date, setDate] = useState<(typeof DATE_FILTERS)[number]["key"]>("today");
  const [decimal, setDecimal] = useState(false);

  return (
    <UserCenterShell title={BN.userCenter.bettingRecord}>
      <NeonCard className="space-y-4">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-4 border-b border-tcl-border-muted pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={cn(
                "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold transition-colors",
                cat === c.key
                  ? "border-tcl-gold text-tcl-gold"
                  : "border-transparent text-tcl-muted hover:text-tcl-white",
              )}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-tcl-red/40 bg-tcl-red/10 px-3 py-1 text-caption text-tcl-red-bright"
          >
            {BN.userCenter.expandedList}
            <ICONS.ChevronRight aria-hidden="true" className="size-3" />
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {DATE_FILTERS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDate(d.key)}
              className={cn(
                "inline-flex items-center gap-1.5 text-caption",
                date === d.key ? "text-tcl-red-bright" : "text-tcl-white/70",
              )}
            >
              <span
                className={cn(
                  "inline-block size-3.5 rounded-full border",
                  date === d.key
                    ? "border-tcl-red-bright bg-tcl-red-bright"
                    : "border-tcl-border-muted",
                )}
              />
              {d.label}
            </button>
          ))}
          <label className="inline-flex items-center gap-2 text-caption text-tcl-white/80">
            <ICONS.Calendar aria-hidden="true" className="size-4 text-tcl-muted" />
            <input
              type="text"
              defaultValue={`${new Date().toISOString().slice(5, 10)} 00:00:00~${new Date().toISOString().slice(5, 10)} 23:59:5`}
              className="h-8 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-[11px] text-tcl-white"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-caption text-tcl-white/80">
            {BN.userCenter.searchCategory}
            <select
              className="h-8 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-[11px] text-tcl-white"
              defaultValue="all"
            >
              <option value="all">{BN.common.all}</option>
            </select>
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-tcl-red px-3 py-1.5 text-caption font-semibold text-white"
          >
            {BN.userCenter.other}
          </button>
          <button
            type="button"
            aria-label={BN.common.filter}
            className="ml-auto rounded-md border border-tcl-border-muted p-1.5 text-tcl-muted"
          >
            <ICONS.Settings aria-hidden="true" className="size-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-caption">
            <thead className="border-b border-tcl-border-muted text-[11px] uppercase tracking-wide text-tcl-muted">
              <tr>
                {COLUMNS.map((c, i) => (
                  <th key={i} className="py-2 px-2 text-left font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUMNS.length} className="py-20 text-center text-tcl-muted">
                  {BN.userCenter.noData}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t border-tcl-border-muted text-caption">
              <tr>
                <td className="py-2 px-2 text-tcl-white">
                  {BN.common.total}
                </td>
                <td className="py-2 px-2 text-tcl-white">0.00</td>
                <td className="py-2 px-2 text-tcl-white">0.00</td>
                <td className="py-2 px-2 text-tcl-white">0.00</td>
                <td className="py-2 px-2 text-tcl-white">0.00</td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 text-caption text-tcl-muted">
          <span>ডেসিমাল পয়েন্ট</span>
          <button
            type="button"
            onClick={() => setDecimal((v) => !v)}
            aria-pressed={decimal}
            className={cn(
              "inline-flex h-5 w-9 items-center rounded-full border transition-colors",
              decimal
                ? "border-tcl-gold bg-tcl-gold/40 justify-end"
                : "border-tcl-border-muted bg-tcl-surface-2 justify-start",
            )}
          >
            <span className="mx-0.5 inline-block size-4 rounded-full bg-tcl-white" />
          </button>
        </div>
      </NeonCard>
    </UserCenterShell>
  );
}
