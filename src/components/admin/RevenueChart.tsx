import { formatBdt } from "@/lib/money";

export interface SeriesPoint {
  date: string;
  deposits: number;
  withdrawals: number;
}

/**
 * Paired daily bars: approved deposits vs paid-out withdrawals. Server
 * rendered, no chart library. Values come straight from the finance overview
 * endpoint; an all-zero period renders as an explicit empty state.
 */
export function RevenueChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(0, ...series.flatMap((p) => [p.deposits, p.withdrawals]));
  if (series.length === 0 || max === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 text-center">
        <div className="px-6">
          <p className="text-sm text-tcl-white">No approved deposits or completed withdrawals in this period</p>
          <p className="mt-1 text-[11px] text-tcl-muted">Bars appear as soon as staff approve deposits or complete payouts.</p>
        </div>
      </div>
    );
  }
  const dense = series.length > 14;
  const label = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-[11px] text-tcl-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-tcl-gold" /> Deposits approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-tcl-red-bright" /> Withdrawals paid
        </span>
        <span className="ml-auto">Peak {formatBdt(max)}</span>
      </div>
      <div
        role="img"
        aria-label={`Daily deposits and withdrawals over ${series.length} days`}
        className="flex h-52 items-end gap-1 rounded-md border border-tcl-border-muted bg-tcl-surface-2/40 px-2 pb-1 pt-3"
      >
        {series.map((p) => (
          <div key={p.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${label(p.date)} — deposits ${formatBdt(p.deposits)}, withdrawals ${formatBdt(p.withdrawals)}`}>
            <div className="flex h-full items-end justify-center gap-[2px]">
              <span
                className="w-full max-w-3 rounded-t-sm bg-tcl-gold"
                style={{ height: `${(p.deposits / max) * 100}%`, minHeight: p.deposits > 0 ? 2 : 0 }}
              />
              <span
                className="w-full max-w-3 rounded-t-sm bg-tcl-red-bright"
                style={{ height: `${(p.withdrawals / max) * 100}%`, minHeight: p.withdrawals > 0 ? 2 : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 px-2 text-[10px] text-tcl-muted">
        {series.map((p, i) => (
          <span key={p.date} className="min-w-0 flex-1 truncate text-center">
            {!dense || i % 5 === 0 || i === series.length - 1 ? label(p.date) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
