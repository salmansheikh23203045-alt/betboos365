import type { Metadata } from "next";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Sports & Matches | TCL11 Admin" };
export const dynamic = "force-dynamic";

interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  startTime: string;
  isLive?: boolean;
  homeScore?: number;
  awayScore?: number;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
}

export default async function AdminSportsPage() {
  let matches: Match[] = [];
  try {
    const res = await backendFetch("/sports");
    if (res.ok) {
      const body = (await res.json()) as { data?: unknown };
      const rows =
        Array.isArray(body.data) ? body.data
          : (body.data && typeof body.data === "object" && "data" in body.data && Array.isArray((body.data as { data: unknown }).data))
            ? (body.data as { data: Match[] }).data
            : [];
      matches = rows as Match[];
    }
  } catch { /* backend offline — handled below */ }

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const finished = matches.filter((m) => m.status === "finished");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Sports &amp; Matches</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Live" value={live.length} icon="CircleDot" tone="live" />
        <StatTile label="Upcoming" value={upcoming.length} icon="Calendar" tone="upcoming" />
        <StatTile label="Finished" value={finished.length} icon="Trophy" tone="finished" />
      </div>

      <NeonCard className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <ICONS.Info aria-hidden="true" className="size-4 text-tcl-gold" />
          <p className="text-[12px] text-tcl-muted">
            Odds, scores and match status come from the configured sports
            adapter. The default is the <code className="text-tcl-white">mock</code> adapter.
            Switching to a licensed provider (BetRadar, Sportradar, etc.) is a
            later step and requires a separate compliance review before
            production.
          </p>
        </div>
      </NeonCard>

      <NeonCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                <th className="py-3 pl-4 pr-3 font-semibold">Match</th>
                <th className="py-3 pr-3 font-semibold">League</th>
                <th className="py-3 pr-3 font-semibold">Odds (H / D / A)</th>
                <th className="py-3 pr-3 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Start</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-tcl-border-muted/50">
                  <td className="py-3 pl-4 pr-3 text-tcl-white">
                    {m.homeTeam} <span className="text-tcl-muted">vs</span> {m.awayTeam}
                    {m.homeScore !== undefined && m.awayScore !== undefined ? (
                      <span className="ml-2 rounded-md bg-tcl-surface-2 px-1.5 py-0.5 text-[11px] font-bold text-tcl-gold">
                        {m.homeScore} – {m.awayScore}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-tcl-muted">
                    {m.league} <span className="text-tcl-muted">·</span> {m.sport}
                  </td>
                  <td className="py-3 pr-3 font-mono text-[12px] text-tcl-white">
                    {m.homeOdds ?? "—"} / {m.drawOdds || "—"} / {m.awayOdds ?? "—"}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusChip status={m.status} />
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-tcl-muted">
                    {new Date(m.startTime).toLocaleString()}
                  </td>
                </tr>
              ))}
              {matches.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-tcl-muted">No matches available.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </NeonCard>
    </div>
  );
}

function StatTile({ label, value, icon, tone }: { label: string; value: number; icon: "CircleDot" | "Calendar" | "Trophy"; tone: "live" | "upcoming" | "finished" }) {
  const Icon = ICONS[icon];
  const toneClass =
    tone === "live" ? "bg-tcl-red/10 text-tcl-red-bright" :
    tone === "upcoming" ? "bg-tcl-gold/10 text-tcl-gold" :
    "bg-tcl-muted/10 text-tcl-muted";
  return (
    <NeonCard className="flex items-center gap-3 p-4">
      <span className={`inline-flex size-10 items-center justify-center rounded-md ${toneClass}`}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-[11px] uppercase text-tcl-muted">{label}</p>
        <p className="font-display text-heading-md text-tcl-white">{value}</p>
      </div>
    </NeonCard>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "live" ? "bg-tcl-red/30 text-tcl-red-bright" :
    status === "upcoming" ? "bg-tcl-gold/20 text-tcl-gold" :
    status === "finished" ? "bg-tcl-muted/20 text-tcl-muted" :
    "bg-tcl-muted/10 text-tcl-muted";
  return <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
}
