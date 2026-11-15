import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";
import { RevenueChart, type SeriesPoint } from "@/components/admin/RevenueChart";

export const metadata: Metadata = { title: "Super Admin Dashboard | BetBoos365" };
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

interface FinanceOverview {
  allTime: {
    deposits: { amount: number; count: number };
    withdrawals: { amount: number; count: number };
    netCashFlow: number;
    bonuses: { amount: number; count: number };
  };
  period: { deposits: { amount: number }; withdrawals: { amount: number }; netCashFlow: number };
  pending: { deposits: { amount: number; count: number }; withdrawals: { amount: number; count: number } };
  playerBalances: { available: number; reserved: number };
  series: SeriesPoint[];
}

interface LedgerRow {
  id: string;
  username: string;
  type: string;
  amount: number;
  createdAt: string;
}

async function fetchJson<T>(path: string, accessToken: string): Promise<T | null> {
  try {
    const res = await backendFetch(path, { accessToken });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 Days" },
  { days: 30, label: "30 Days" },
  { days: 90, label: "90 Days" },
] as const;

const LEDGER_LABEL: Record<string, string> = {
  DEPOSIT_CREDIT: "Deposit",
  WITHDRAWAL_RESERVE: "Withdrawal hold",
  WITHDRAWAL_RELEASE: "Hold released",
  WITHDRAWAL_DEBIT: "Withdrawal paid",
  ADJUSTMENT_CREDIT: "Adjustment +",
  ADJUSTMENT_DEBIT: "Adjustment −",
  BONUS_CREDIT: "Bonus",
};
const isOutflow = (type: string) =>
  type === "WITHDRAWAL_RESERVE" || type === "WITHDRAWAL_DEBIT" || type === "ADJUSTMENT_DEBIT";

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
  { label: "Users",          icon: "User",       href: "/admin/users",        tint: "text-tcl-gold" },
  { label: "Add Admin",      icon: "Crown",      href: "/admin/admins",       tint: "text-tcl-gold" },
  { label: "Add Promotion",  icon: "Gift",       href: "/admin/promotions",   tint: "text-tcl-red-bright" },
  { label: "Manage Games",   icon: "Gamepad2",   href: "/admin/games",        tint: "text-tcl-gold" },
  { label: "Sports",         icon: "Target",     href: "/admin/sports",       tint: "text-tcl-gold" },
  { label: "Transactions",   icon: "History",    href: "/admin/transactions", tint: "text-tcl-gold" },
  { label: "View Reports",   icon: "TrendingUp", href: "/admin/reports",      tint: "text-tcl-gold" },
  { label: "System Settings",icon: "Settings",   href: "/admin/settings",     tint: "text-tcl-muted" },
];

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = (await getSession())!; // layout guarantees non-null admin
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  const requested = Number((await searchParams).days);
  const days = RANGES.some((r) => r.days === requested) ? requested : 7;
  // Money figures need transactions.view; the backend enforces it as well.
  const canSeeMoney = (user.permissions ?? []).includes("transactions.view");
  const [stats, dbUp, finance, recent] = await Promise.all([
    at ? fetchStats(at) : Promise.resolve(null),
    fetchReadinessDb(),
    at && canSeeMoney
      ? fetchJson<FinanceOverview>(`/admin/finance/overview?days=${days}`, at)
      : Promise.resolve(null),
    at && canSeeMoney
      ? fetchJson<{ data: LedgerRow[] }>("/admin/finance/ledger?page=1&limit=6", at)
      : Promise.resolve(null),
  ]);

  const firstName = user.firstName || user.username;

  // Every figure is read from the database. When a source is unavailable the
  // card shows a dash and a "Pending" marker: never an invented number.
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
    stat(
      "Total Deposits",
      "Wallet",
      finance ? formatBdt(finance.allTime.deposits.amount) : "—",
      finance ? `${finance.allTime.deposits.count} approved · ${finance.pending.deposits.count} pending` : null,
      finance ? "live" : "pending",
    ),
    stat(
      "Total Withdrawals",
      "ArrowRight",
      finance ? formatBdt(finance.allTime.withdrawals.amount) : "—",
      finance ? `${finance.allTime.withdrawals.count} paid · ${finance.pending.withdrawals.count} open` : null,
      finance ? "live" : "pending",
    ),
    stat(
      "Net Cash Flow",
      "TrendingUp",
      finance ? formatBdt(finance.allTime.netCashFlow) : "—",
      finance
        ? `Wallet balances (players + agents) ${formatBdt(finance.playerBalances.available + finance.playerBalances.reserved)}`
        : null,
      finance ? "live" : "pending",
    ),
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
            Here&apos;s what&apos;s happening on BetBoos365 today.
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
        {/* Revenue Overview — approved deposits vs paid withdrawals, per day */}
        <NeonCard className="space-y-3 p-4 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-heading-md uppercase text-tcl-white">Revenue Overview</h3>
            {finance ? (
              <nav aria-label="Period" className="flex overflow-hidden rounded-pill border border-tcl-border-muted text-[11px]">
                {RANGES.map((r) => (
                  <Link
                    key={r.days}
                    href={`/admin?days=${r.days}`}
                    scroll={false}
                    aria-current={r.days === days ? "page" : undefined}
                    className={cn(
                      "px-3 py-1.5 font-semibold",
                      r.days === days ? "bg-tcl-red/30 text-tcl-red-bright" : "text-tcl-muted hover:text-tcl-white",
                    )}
                  >
                    {r.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
          {finance ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Deposits" value={formatBdt(finance.period.deposits.amount)} tone="text-tcl-gold" />
                <MiniStat label="Withdrawals" value={formatBdt(finance.period.withdrawals.amount)} tone="text-tcl-red-bright" />
                <MiniStat label="Net" value={formatBdt(finance.period.netCashFlow)} tone="text-tcl-white" />
              </div>
              <RevenueChart series={finance.series} />
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 px-6 text-center text-[12px] text-tcl-muted">
              {canSeeMoney ? "Finance data is unavailable right now." : "Financial figures need the transactions.view permission."}
            </div>
          )}
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
            <StatusRow label="Database"       ok={dbUp}    okLabel="Online" offLabel="Unreachable" note="MySQL" />
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
            {recent ? (
              <Link href="/admin/transactions" className="text-[11px] font-semibold text-tcl-gold hover:underline">
                View all
              </Link>
            ) : null}
          </div>
          {!recent ? (
            <p className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 p-6 text-center text-[12px] text-tcl-muted">
              {canSeeMoney ? "Ledger unavailable right now." : "Needs the transactions.view permission."}
            </p>
          ) : recent.data.length === 0 ? (
            <p className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2/50 p-6 text-center text-[12px] text-tcl-muted">
              No wallet movements yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.data.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-tcl-white">{t.username}</p>
                    <p className="text-[10px] uppercase text-tcl-muted">
                      {LEDGER_LABEL[t.type] ?? t.type} ·{" "}
                      <span suppressHydrationWarning>{new Date(t.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                  <span className={cn("tabular-nums text-sm font-semibold", isOutflow(t.type) ? "text-tcl-red-bright" : "text-tcl-gold")}>
                    {isOutflow(t.type) ? "−" : "+"}
                    {formatBdt(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-tcl-muted">{label}</p>
      <p className={cn("truncate font-display text-lg tabular-nums", tone)}>{value}</p>
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
