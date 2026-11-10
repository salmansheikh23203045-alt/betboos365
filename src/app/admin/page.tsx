import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch, readBackendError } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Admin Dashboard | TCL11" };
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

async function fetchStats(accessToken: string): Promise<
  | { ok: true; stats: DashboardStats }
  | { ok: false; status: number; message: string }
> {
  const res = await backendFetch("/admin/dashboard", { accessToken });
  if (!res.ok) {
    const err = await readBackendError(res);
    return { ok: false, status: err.status, message: err.message };
  }
  const body = (await res.json()) as { data?: DashboardStats };
  if (!body.data) return { ok: false, status: 500, message: "Malformed response" };
  return { ok: true, stats: body.data };
}

const CARDS: Array<{ key: keyof DashboardStats; label: string; icon: keyof typeof ICONS }> = [
  { key: "totalUsers", label: "Total Users", icon: "Users" },
  { key: "activeUsers", label: "Active Users", icon: "ShieldCheck" },
  { key: "recentRegistrations", label: "New (24h)", icon: "User" },
  { key: "totalGames", label: "Active Games", icon: "Gamepad2" },
  { key: "activePromotions", label: "Active Promotions", icon: "Gift" },
  { key: "openTickets", label: "Open Tickets", icon: "MessageCircle" },
  { key: "connectedClients", label: "Live WS Clients", icon: "Zap" },
];

export default async function AdminPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");

  const isAdmin = user.roles.includes("admin") || user.roles.includes("super_admin");
  // Middleware already guards this, but defense in depth: non-admins never see numbers.
  if (!isAdmin) redirect("/");

  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  const result = at
    ? await fetchStats(at)
    : ({ ok: false, status: 401, message: "Not authenticated" } as const);

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="font-display text-heading-lg uppercase text-gold-gradient">Admin Dashboard</h1>
        <p className="text-caption text-tcl-muted">
          Signed in as <span className="text-tcl-white">@{user.username}</span> · Roles: {user.roles.join(", ")}
        </p>
      </div>

      {!result.ok ? (
        <NeonCard className="space-y-2">
          <SectionHeading title="Dashboard unavailable" icon="Info" />
          <p className="text-caption text-tcl-muted">
            Could not load live stats ({result.status}). {result.message}
          </p>
        </NeonCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => {
            const Icon = ICONS[c.icon];
            return (
              <NeonCard key={c.key} className="flex items-center gap-3 p-4">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-tcl-gold/10 text-tcl-gold">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-tcl-muted">{c.label}</p>
                  <p className="font-display text-heading-md text-tcl-white">{result.stats[c.key]}</p>
                </div>
              </NeonCard>
            );
          })}
        </div>
      )}

      <NeonCard className="space-y-2">
        <SectionHeading title="About this page" icon="Shield" />
        <p className="text-caption text-tcl-muted">
          Live stats come from <code className="text-tcl-white">GET /api/v1/admin/dashboard</code>, which runs
          parallel <code className="text-tcl-white">prisma.*.count()</code> queries against PostgreSQL.
          Access is gated by middleware (edge) and re-checked here on the server before data loads.
        </p>
      </NeonCard>
    </div>
  );
}
