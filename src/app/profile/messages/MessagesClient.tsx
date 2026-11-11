"use client";

import { useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

interface Message {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TABS = [
  { key: "inbox", label: BN.userCenter.inbox },
  { key: "outbox", label: BN.userCenter.outbox },
] as const;

export function MessagesClient({
  items,
  backendDown,
}: {
  items: Message[];
  backendDown: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("inbox");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = tab === "inbox" ? items : [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  return (
    <UserCenterShell title={BN.userCenter.internalMessages}>
      <NeonCard className="space-y-4">
        <div className="flex gap-4 border-b border-tcl-border-muted pb-2">
          {TABS.map((t) => (
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

        <div className="flex items-center gap-3 border-b border-tcl-border-muted pb-2 text-caption">
          <label className="inline-flex items-center gap-2 text-tcl-white/80">
            <input
              type="checkbox"
              checked={rows.length > 0 && selected.size === rows.length}
              onChange={toggleAll}
              aria-label={BN.userCenter.selectAll}
            />
            {BN.userCenter.selectAll}
          </label>
          <button
            type="button"
            aria-label={BN.common.delete}
            className="rounded-md border border-tcl-border-muted p-1.5 text-tcl-muted hover:text-tcl-red-bright"
          >
            <ICONS.X aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label={BN.notifications.markRead}
            className="rounded-md border border-tcl-border-muted p-1.5 text-tcl-muted hover:text-tcl-gold"
          >
            <ICONS.Mail aria-hidden="true" className="size-4" />
          </button>
          <div className="ml-auto inline-flex items-center gap-1 text-tcl-muted">
            {BN.userCenter.sortByTime}
            <ICONS.ChevronDown aria-hidden="true" className="size-3.5" />
          </div>
        </div>

        {backendDown ? (
          <div className="flex items-center gap-2 rounded-md border border-tcl-gold/40 bg-tcl-gold/5 p-3 text-caption text-tcl-gold">
            <ICONS.AlertTriangle aria-hidden="true" className="size-4" />
            ব্যাকএন্ডের সঙ্গে সংযোগ নেই — পরে আবার চেষ্টা করুন।
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 py-16 text-center">
            <ICONS.Mail
              aria-hidden="true"
              className="size-10 text-tcl-muted"
            />
            <p className="text-caption text-tcl-white">
              {BN.userCenter.noMessages}
            </p>
            <p className="text-[11px] text-tcl-muted">
              নতুন নোটিফিকেশন পেলে এখানে দেখানো হবে।
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-tcl-border-muted">
            {rows.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 py-3 text-caption"
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                  aria-label={`select ${m.title}`}
                />
                <ICONS.Mail
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0",
                    m.isRead ? "text-tcl-muted" : "text-tcl-gold",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate",
                      m.isRead ? "text-tcl-white/70" : "text-tcl-white",
                    )}
                  >
                    {m.title}
                  </p>
                  <p className="truncate text-[11px] text-tcl-muted">
                    {m.message}
                  </p>
                </div>
                <time className="shrink-0 text-[11px] text-tcl-muted">
                  {new Date(m.createdAt).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-3">
          <button
            type="button"
            aria-label={BN.common.delete}
            className="rounded-md border border-tcl-border-muted p-1.5 text-tcl-muted hover:text-tcl-red-bright"
          >
            <ICONS.X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </NeonCard>
    </UserCenterShell>
  );
}
