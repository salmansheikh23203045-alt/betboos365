import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Super Admin Dashboard | TCL11" };
export const dynamic = "force-dynamic";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  activePromotions: number;
  openTickets: number;
  connectedClients: number;
  recentRegistrations: number;
}

async function fetchStats(accessToken: string): Promise<DashboardStats | null> {
  const res = await backendFetch("/admin/dashboard", { accessToken });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: DashboardStats };
  return body.data ?? null;
}

async function fetchReadinessDb(): Promise<boolean> {
  // Reusing /promotions as an app-layer DB round-trip (same probe Railway uses).
  try {
    const res = await backendFetch("/promotions", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

const QUICK_ACTIONS: Array<{ label: string; icon: IconName; href: string; tint: string }> = [
  { label: "Add User",       icon: "User",       href: "/signup",             tint: "text-tcl-gold" },
  { label: "Add Admin",      icon: "Crown",      href: "/admin/admins",       tint: "text-tcl-gold" },
  { label: "Add Promotion",  icon: "Gift",       href: "/admin/promotions",   tint: "text-tcl-red-bright" },
  { label: "Manage Games",   icon: "Gamepad2",   href: "/admin/games",        tint: "text-tcl-gold" },
  { label: "Set Odds",       icon: "Target",     href: "/admin/sports",       tint: "text-tcl-gold" },
  { label: "Upload Match",   icon: "Calendar",   href: "/admin/sports",       tint: "text-tcl-gold" },
  { label: "View Reports",   icon: "TrendingUp", href: "/admin/reports",      tint: "text-tcl-gold" },
  { label: "System Settings",icon: "Settings",   href: "/admin/settings",     tint: "text-tcl-muted" },
];

export default async function AdminOverviewPage() {
  const user = (await getSession())!; // layout guarantees non-null admin
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  const [stats, dbUp] = await Promise.all([
    at ? fetchStats(at) : Promise.resolve(null),
    fetchReadinessDb(),
  ]);

  const firstName = user.firstName || user.username;

  // Real metrics (from the DB) vs placeholder metrics (mock: no backend
  // support yet). The user's strict rule is "Never invent financial
  // figures" — we show a dash and a visible "pending" marker for those.
  const stat = (
    label: string,
    icon: IconName,
    value: string,
    deltaLabel: string | null,
    status: "live" | "pending",
  ) => ({ label, icon, value, deltaLabel, status });
  const STAT_CARDS = [
    stat("Total Users",       "User",       stats?.totalUsers.toLocaleString()       ?? "—", null, stats ? "live" : "pending"),
    stat("Active Users",      "Users",      stats?.activeUsers.toLocaleString()      ?? "—", null, stats ? "live" : "pending"),
    stat("Total Deposits",    "Wallet",     "—",                                          "No wallet backend yet", "pending"),
    stat("Total Withdrawals", "ArrowRight", "—",                                          "No wallet backend yet", "pending"),
    stat("Net Profit",        "TrendingUp", "—",                                          "No financial backend yet", "pending"),
    stat("Live Users",        "Zap",        (stats?.connectedClients ?? 0).toString(),    "Live WebSocket clients", stats ? "live" : "pending"),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-xl border border-tcl-red/30 bg-gradient-to-br from-tcl-red/20 via-tcl-surface-1 to-tcl-black shadow-[0_0_40px_rgba(220,38,38,0.2)]">
        <div className="relative flex flex-col gap-2 p-5 lg:p-6">
          <div className="flex items-center gap-3">
            <ICONS.Crown aria-hidden="true" className="size-6 text-tcl-gold" />
            <h2 className="font-display text-display-md uppercase text-tcl-white">
              Welcome, {firstName}
            </h2>
          </div>
          <p className="text-caption text-tcl-muted">
            Here&apos;s what&apos;s happening on TCL11 today.
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAT_CARDS.map((s) => {
            const Icon = ICONS[s.icon];
            return (
              <NeonCard key={s.label} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("inline-flex size-9 items-center justify-center rounded-md", s.status === "live" ? "bg-tcl-success/10 text-tcl-success" : "bg-tcl-muted/10 text-tcl-muted")}>
                    <Icon aria-hidden="true" className="size-4.5" />
                  </span>
                  {s.status === "pending" ? (
                    <span className="rounded-pill bg-tcl-muted/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-tcl-muted">Pending</span>
                  ) : null}
                </div>
                <p className="text-[11px] uppercase tracking-wide text-tcl-muted">{s.label}</p>
                <p className="font-display text-heading-lg text-tcl-white">{s.value}</p>
                {s.deltaLabel ? (
                  <p className="text-[10px] text-tcl-muted">{s.deltaLabel}</p>
                ) : null}
              </NeonCard>
            );
          })}
        </div>
      </section>

      {/* Revenue + Quick Actions + System Status */}
      <section className="grid gap-4 lg:grid-cols-12">
        {/* Revenue Overview — placeholder because we have no financial series */}
        <NeonCard className="space-y-3 p-4 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-heading-md uppercase text-tcl-white">
              Revenue Overview
              <span className="ml-2 align-middle text-[10px] font-normal uppercase tracking-wider text-tcl-muted">
                Preview
              </span>
            </h3>
            <div className="flex overflow-hidden rounded-pill border border-tcl-border-muted text-[11px]">
              {["Today", "7 Days", "30 Days", "Custom"].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  className={cn("px-3 py-1.5 font-semibold", i === 1 ? "bg-tcl-red/30 text-tcl-red-bright" : "text-tcl-muted hover:text-tcl-white")}
                  disabled
                  title="Revenue analytics — connect financial backend first"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-64 overflow-hidden rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50">
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="px-6">
                <ICONS.TrendingUp aria-hidden="true" className="mx-auto mb-2 size-7 text-tcl-muted" />
                <p className="text-sm text-tcl-white">No revenue data yet</p>
                <p className="mt-1 text-[11px] text-tcl-muted">
                  Deposit / withdrawal / profit series will render here once a
                  financial backend is wired. Never invented in the meantime.
                </p>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Quick Actions */}
        <NeonCard className="space-y-3 p-4 lg:col-span-4">
          <h3 className="font-display text-heading-md uppercase text-tcl-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const Icon = ICONS[a.icon];
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 py-3 text-center text-[11px] font-semibold text-tcl-white transition-colors hover:border-tcl-red/40 hover:bg-tcl-red/10"
                >
                  <Icon aria-hidden="true" className={cn("size-5", a.tint)} />
                  <span>{a.label}</span>
                </Link>
              );
            })}
          </div>
        </NeonCard>

        {/* System Status */}
        <NeonCard className="space-y-3 p-4 lg:col-span-2">
          <h3 className="font-display text-heading-md uppercase text-tcl-white">System Status</h3>
          <ul className="space-y-2 text-sm">
            <StatusRow label="API Server"     ok={!!stats} okLabel="Online" offLabel="Unreachable" />
            <StatusRow label="Database"       ok={dbUp}    okLabel="Online" offLabel="Unreachable" note="PostgreSQL" />
            <StatusRow label="Game Providers" ok={true}    okLabel="Online" offLabel="Offline" note="Static catalog" />
            <StatusRow label="Payment Gateway" ok={null}   okLabel="Not configured" offLabel="Offline" pending />
            <StatusRow label="Cron Jobs"       ok={null}   okLabel="Not configured" offLabel="Stopped" pending />
          </ul>
          <p className="border-t border-tcl-border-muted pt-2 text-center text-[11px] text-tcl-success">
            Uptime: — <span className="text-tcl-muted">(no metrics endpoint)</span>
          </p>
        </NeonCard>
      </section>

      {/* Recent Transactions + Top Games + Latest Activities */}
      <section className="grid gap-4 lg:grid-cols-12">
        <NeonCard className="space-y-3 p-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-heading-md uppercase text-tcl-white">Recent Transactions</h3>
            <span className="rounded-pill bg-tcl-muted/10 px-2 py-0.5 text-[10px] font-bold uppercase text-tcl-muted">
              Pending backend
            </span>
          </div>
          <p className="text-[12px] text-tcl-muted">
            No transactions endpoint yet. Deposit/withdrawal records show here
            once a wallet backend is implemented — never invented.
          </p>
          <div className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 p-6 text-center text-[12px] text-tcl-muted">
            <ICONS.History aria-hidden="true" className="mx-auto mb-2 size-6" />
            Waiting for <code className="text-tcl-white">GET /admin/transactions</code>.
          </div>
        </NeonCard>

        <NeonCard className="space-y-3 p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-heading-md uppercase text-tcl-white">
              Top Games
            </h3>
            <span className="text-[10px] text-tcl-muted">by seeded catalog</span>
          </div>
          <p className="text-[11px] text-tcl-muted">
            Ranking by play volume requires game-launch analytics. Below is the
            current catalog in display order.
          </p>
          <TopGamesList />
        </NeonCard>

        <NeonCard className="space-y-3 p-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-heading-md uppercase text-tcl-white">Latest Activities</h3>
          </div>
          <LatestAuditFeed />
        </NeonCard>
      </section>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  okLabel,
  offLabel,
  note,
  pending,
}: {
  label: string;
  ok: boolean | null;
  okLabel: string;
  offLabel: string;
  note?: string;
  pending?: boolean;
}) {
  const dot = pending || ok === null ? "bg-tcl-muted" : ok ? "bg-tcl-success" : "bg-tcl-red-bright";
  const text = pending || ok === null ? "Pending" : ok ? okLabel : offLabel;
  const textClr = pending || ok === null ? "text-tcl-muted" : ok ? "text-tcl-success" : "text-tcl-red-bright";
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dot)} />
        <span className="text-tcl-white">{label}</span>
        {note ? <span className="text-[10px] text-tcl-muted">({note})</span> : null}
      </span>
      <span className={cn("text-[11px] font-semibold uppercase", textClr)}>{text}</span>
    </li>
  );
}

async function TopGamesList() {
  // Public endpoint — reuses existing game listing.
  try {
    const res = await backendFetch("/games");
    if (!res.ok) throw new Error("offline");
    const body = (await res.json()) as { data?: unknown };
    const all: Array<{ id: string; title: string; category: string }> =
      Array.isArray(body.data)
        ? (body.data as Array<{ id: string; title: string; category: string }>)
        : (body.data && typeof body.data === "object" && "data" in body.data && Array.isArray((body.data as { data: unknown }).data))
          ? ((body.data as { data: Array<{ id: string; title: string; category: string }> }).data)
          : [];
    const rows = all.slice(0, 5);
    if (rows.length === 0) {
      return (
        <p className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 p-3 text-center text-[12px] text-tcl-muted">
          No games in catalog.
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {rows.map((g) => (
          <li key={g.id} className="flex items-center gap-3 rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 p-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-tcl-gold/10 text-tcl-gold">
              <span className="text-xs font-bold">{g.title.slice(0, 2)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-tcl-white">{g.title}</p>
              <p className="text-[10px] uppercase text-tcl-muted">{g.category}</p>
            </div>
            <span className="rounded-pill bg-tcl-muted/10 px-1.5 py-0.5 text-[10px] text-tcl-muted">—</span>
          </li>
        ))}
      </ul>
    );
  } catch {
    return (
      <p className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 p-3 text-center text-[12px] text-tcl-red-bright">
        Games catalog unavailable.
      </p>
    );
  }
}

async function LatestAuditFeed() {
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  if (!at) return null;
  try {
    const res = await backendFetch("/admin/audit-logs", { accessToken: at });
    if (!res.ok) throw new Error("fetch failed");
    const body = (await res.json()) as { data?: unknown };
    type AuditRow = { id: string; action: string; userId: string | null; timestamp?: string; createdAt?: string };
    const all: AuditRow[] = Array.isArray(body.data)
      ? (body.data as AuditRow[])
      : (body.data && typeof body.data === "object" && "data" in body.data && Array.isArray((body.data as { data: unknown }).data))
        ? ((body.data as { data: AuditRow[] }).data)
        : [];
    const rows = all.slice(0, 6);
    if (rows.length === 0) {
      return <p className="text-[11px] text-tcl-muted">No recent activity.</p>;
    }
    return (
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 p-2">
            <span className="mt-0.5 size-2 rounded-full bg-tcl-red-bright" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-tcl-white">{r.action}</p>
              <p className="truncate text-[10px] text-tcl-muted">
                {r.userId ? r.userId.slice(0, 8) : "system"} · {new Date(r.timestamp ?? r.createdAt ?? "").toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  } catch {
    return <p className="text-[11px] text-tcl-red-bright">Audit feed unavailable.</p>;
  }
}
