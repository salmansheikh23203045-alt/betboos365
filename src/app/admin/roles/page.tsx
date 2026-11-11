import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Roles & Permissions | TCL11 Admin" };
export const dynamic = "force-dynamic";

const ROLES: Array<{ slug: string; label: string; summary: string; tint: string; permissions: string[] }> = [
  {
    slug: "user",
    label: "User",
    summary: "Baseline role for every registered player.",
    tint: "bg-tcl-muted/10 text-tcl-muted",
    permissions: ["View public pages", "Manage own profile", "Claim eligible promotions", "Open support tickets"],
  },
  {
    slug: "vip",
    label: "VIP",
    summary: "Players who crossed the VIP threshold. Unlocks VIP-only promos.",
    tint: "bg-tcl-gold/10 text-tcl-gold",
    permissions: ["All User permissions", "Claim VIP-only promotions", "Higher deposit/withdrawal priority (when wallet backend lands)"],
  },
  {
    slug: "moderator",
    label: "Moderator",
    summary: "Support-focused staff. Handles tickets, no admin dashboard access.",
    tint: "bg-tcl-muted/20 text-tcl-white",
    permissions: ["Reply to any support ticket", "Change ticket status", "View contact submissions"],
  },
  {
    slug: "admin",
    label: "Admin",
    summary: "Operational admin. Everything except privileged super-admin actions.",
    tint: "bg-tcl-red/20 text-tcl-red-bright",
    permissions: [
      "View admin dashboard (/admin)",
      "Manage users (search, view, deactivate)",
      "Manage promotions, games, support tickets",
      "View audit logs",
    ],
  },
  {
    slug: "super_admin",
    label: "Super Admin",
    summary: "Highest role. Can edit admin roles and reach privileged settings.",
    tint: "bg-tcl-gold/20 text-tcl-gold",
    permissions: [
      "All Admin permissions",
      "Edit other users' roles (incl. grant/revoke admin)",
      "View Admin section (/admin/admins)",
      "System settings (when built)",
    ],
  },
];

export default async function AdminRolesPage() {
  const session = (await getSession())!;
  if (!session.roles.includes("super_admin")) redirect("/admin");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Roles &amp; Permissions</h2>
      </div>
      <NeonCard className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <ICONS.Shield aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tcl-gold" />
          <p className="text-[12px] text-tcl-muted">
            Role definitions are declared in code (<code className="text-tcl-white">server/src/common/interfaces/index.ts</code> and the Prisma <code className="text-tcl-white">UserRole</code> enum) and enforced by{" "}
            <code className="text-tcl-white">RolesGuard</code> on the backend plus{" "}
            <code className="text-tcl-white">src/proxy.ts</code> on the edge. Granular per-permission editing is deferred — current model is role-based, not permission-matrix-based.
          </p>
        </div>
      </NeonCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((r) => (
          <NeonCard key={r.slug} className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-heading-md uppercase text-tcl-white">{r.label}</h3>
              <span className={cn("rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase", r.tint)}>
                {r.slug}
              </span>
            </div>
            <p className="text-[12px] text-tcl-muted">{r.summary}</p>
            <ul className="space-y-1 text-[12px] text-tcl-white">
              {r.permissions.map((p) => (
                <li key={p} className="flex items-start gap-1.5">
                  <ICONS.Check aria-hidden="true" className="mt-0.5 size-3.5 text-tcl-success" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </NeonCard>
        ))}
      </div>
    </div>
  );
}
