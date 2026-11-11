import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "System Settings | TCL11 Admin" };
export const dynamic = "force-dynamic";

/**
 * Settings are currently read from environment variables at boot, which
 * means they're configured on Railway/Vercel's dashboards, NOT edited here.
 * That's the right default for a security-sensitive config surface. We
 * surface what the running system HAS, so admins can verify.
 */
export default async function AdminSettingsPage() {
  const session = (await getSession())!;
  if (!session.roles.includes("super_admin")) redirect("/admin");

  const settings = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    appUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "(local)",
    backendConfigured: Boolean(process.env.BACKEND_API_URL),
    sportsProvider: "mock (from backend)",
    jwtRotationDays: "7",
    jwtAccessTtl: "15m",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">System Settings</h2>
      </div>

      <NeonCard className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <ICONS.Shield aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tcl-gold" />
          <p className="text-[12px] text-tcl-muted">
            Platform settings are configured through environment variables on
            Vercel (frontend) and Railway (backend) rather than editable from
            this screen. This keeps secrets out of the database and out of git.
            Secret values are <strong className="text-tcl-white">never</strong> rendered here.
          </p>
        </div>
      </NeonCard>

      <NeonCard className="space-y-2 p-0">
        <table className="w-full text-sm">
          <tbody>
            <SettingRow label="Environment" value={settings.nodeEnv} />
            <SettingRow label="App URL" value={settings.appUrl} />
            <SettingRow label="Backend API configured" value={settings.backendConfigured ? "yes" : "no — fallback to localhost"} />
            <SettingRow label="Sports provider" value={settings.sportsProvider} />
            <SettingRow label="JWT access TTL" value={settings.jwtAccessTtl} />
            <SettingRow label="JWT refresh rotation" value={`${settings.jwtRotationDays} days`} />
          </tbody>
        </table>
      </NeonCard>

      <NeonCard className="space-y-3 p-4">
        <h3 className="font-display text-heading-md uppercase text-tcl-white">
          Platform capabilities
        </h3>
        <p className="text-[12px] text-tcl-muted">
          Feature flags, in-flight work and known gaps — surfaced here so the
          admin team always knows what the live system can and cannot do.
        </p>
        <ul className="space-y-2 text-sm">
          <CapRow label="Authentication (JWT + refresh rotation, HttpOnly cookies, RBAC)" status="live" />
          <CapRow label="User Management (list, search, role edit, deactivate)" status="live" />
          <CapRow label="Promotions CRUD (create / edit / delete)" status="live" />
          <CapRow label="Game catalog listing + active-toggle" status="live" />
          <CapRow label="Audit logs" status="live" />
          <CapRow
            label="Admin topbar notification center"
            status="unavailable"
            note="The bell icon is a static placeholder. A notifications stream requires GET /admin/notifications + a WebSocket subscription, neither of which exists yet. Clicking the icon is a no-op; aria-disabled is set so assistive tech announces that."
          />
          <CapRow
            label="Admin global search"
            status="unavailable"
            note="The search input in the topbar is visually present but non-functional. A real admin search needs a server-side search endpoint (users, transactions, games, …) with throttling and permission scoping. The `/` keyboard shortcut is unwired."
          />
          <CapRow label="Transactions / Wallet / Finance / Reports" status="deferred" note="Deliberate — no fabricated financial numbers." />
          <CapRow label="Sports/match odds editing" status="read-only" note="Sports data comes from a provider adapter; the admin UI is read-only until a licensed provider is signed." />
          <CapRow label="Game CRUD beyond toggle (new games, title/thumbnail edits)" status="deferred" note="Backend `PATCH /games/:id` supports partial updates; a dedicated admin form is a follow-up." />
          <CapRow label="Password reset / email verification" status="deferred" note="No mail gateway configured." />
        </ul>
      </NeonCard>
    </div>
  );
}

function CapRow({
  label,
  status,
  note,
}: {
  label: string;
  status: "live" | "unavailable" | "deferred" | "read-only";
  note?: string;
}) {
  const toneClass =
    status === "live" ? "bg-tcl-success/20 text-tcl-success" :
    status === "unavailable" ? "bg-tcl-red/20 text-tcl-red-bright" :
    status === "read-only" ? "bg-tcl-gold/20 text-tcl-gold" :
    "bg-tcl-muted/10 text-tcl-muted";
  const toneLabel =
    status === "live" ? "Live" :
    status === "unavailable" ? "Not available" :
    status === "read-only" ? "Read-only" :
    "Deferred";
  return (
    <li className="flex items-start gap-3 border-b border-tcl-border-muted/50 pb-2 last:border-0 last:pb-0">
      <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>{toneLabel}</span>
      <div className="min-w-0">
        <p className="text-tcl-white">{label}</p>
        {note ? <p className="mt-0.5 text-[11px] text-tcl-muted">{note}</p> : null}
      </div>
    </li>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-tcl-border-muted/50 last:border-0">
      <td className="w-56 px-4 py-3 text-caption uppercase text-tcl-muted">{label}</td>
      <td className="px-4 py-3 font-mono text-[12px] text-tcl-white">{value}</td>
    </tr>
  );
}
