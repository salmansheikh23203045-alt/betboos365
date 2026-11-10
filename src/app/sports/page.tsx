"use client";

import { useState } from "react";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { SPORT_EVENTS } from "@/data/pages";

const SPORTS = ["All", "Football", "Basketball", "Tennis", "Cricket"] as const;

function OddsButton({ odds, label, selected, onSelect }: { odds: number; label: string; selected: boolean; onSelect: () => void }) {
  if (odds === 0) return null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-center transition-all duration-200 cursor-pointer",
        selected
          ? "border-tcl-gold bg-tcl-gold/15 shadow-[0_0_8px_-2px_rgb(255_194_26/0.4)]"
          : "border-tcl-border-muted bg-tcl-surface-2 hover:border-tcl-gold hover:bg-tcl-gold/10",
      )}
    >
      <span className="text-[10px] uppercase text-tcl-muted">{label}</span>
      <span className={cn("text-sm font-bold", selected ? "text-tcl-gold" : "text-tcl-gold")}>{odds.toFixed(2)}</span>
    </button>
  );
}

export default function SportsPage() {
  const [active, setActive] = useState("All");
  const [selectedOdds, setSelectedOdds] = useState<Set<string>>(new Set());
  const filtered = active === "All" ? SPORT_EVENTS : SPORT_EVENTS.filter((e) => e.sport === active);

  function toggleOdd(key: string) {
    setSelectedOdds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Sports" subtitle="Bet on your favorite teams and tournaments" icon="Trophy" />

      <div className="flex flex-wrap gap-2">
        {SPORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={cn(
              "h-8 rounded-pill px-4 text-caption font-semibold transition-all duration-200 cursor-pointer",
              s === active ? "bg-gold-gradient text-tcl-black shadow-[0_0_10px_-2px_rgb(255_194_26/0.5)]" : "bg-tcl-surface-2 text-tcl-muted hover:text-tcl-white hover:bg-tcl-surface-2/80",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((event, i) => (
          <NeonCard key={event.id} as="article" className="animate-stagger space-y-3" style={{ "--stagger-i": i } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-caption font-semibold text-tcl-muted">{event.league}</span>
                {event.isLive ? (
                  <span className="inline-flex items-center gap-1 rounded-pill bg-tcl-red/20 px-2 py-0.5 text-[10px] font-bold uppercase text-tcl-red-bright">
                    <ICONS.CircleDot aria-hidden="true" className="size-2.5 animate-pulse" />
                    Live
                  </span>
                ) : null}
              </div>
              <span className="text-caption text-tcl-muted">{event.startTime}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-tcl-white">
                  {event.homeTeam}
                  {event.isLive ? <span className="ml-2 text-tcl-gold">{event.homeScore}</span> : null}
                </p>
                <p className="font-semibold text-tcl-white">
                  {event.awayTeam}
                  {event.isLive ? <span className="ml-2 text-tcl-gold">{event.awayScore}</span> : null}
                </p>
              </div>
              <div className="flex gap-2">
                <OddsButton odds={event.homeOdds} label="1" selected={selectedOdds.has(`${event.id}-1`)} onSelect={() => toggleOdd(`${event.id}-1`)} />
                {event.drawOdds > 0 ? <OddsButton odds={event.drawOdds} label="X" selected={selectedOdds.has(`${event.id}-X`)} onSelect={() => toggleOdd(`${event.id}-X`)} /> : null}
                <OddsButton odds={event.awayOdds} label="2" selected={selectedOdds.has(`${event.id}-2`)} onSelect={() => toggleOdd(`${event.id}-2`)} />
              </div>
            </div>
          </NeonCard>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ICONS.Trophy aria-hidden="true" className="mx-auto mb-3 size-10 text-tcl-muted" />
          <p className="text-body text-tcl-muted">No events in this category right now</p>
        </div>
      ) : null}
    </div>
  );
}
