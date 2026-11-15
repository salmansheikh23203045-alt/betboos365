import type { Metadata } from "next";
import Link from "next/link";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Promotions | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

interface Promo {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  minVipLevel: number;
}

export default async function AdminPromotionsPage() {
  let rows: Promo[] = [];
  let err: string | null = null;
  try {
    // Include drafts/expired so admins see the full inventory.
    const res = await backendFetch("/promotions?includeInactive=true");
    if (!res.ok) err = `Backend ${res.status}`;
    else {
      const body = (await res.json()) as { data?: Promo[] };
      rows = body.data ?? [];
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Network error";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-heading-lg uppercase text-tcl-white">Promotions</h2>
          <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[11px] text-tcl-muted">
            {rows.length} total
          </span>
        </div>
        <PrimaryButton href="/admin/promotions/new" size="md">
          + New Promotion
        </PrimaryButton>
      </div>

      {err ? (
        <NeonCard className="p-4 text-center text-tcl-red-bright">Could not load: {err}</NeonCard>
      ) : (
        <NeonCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="py-3 pl-4 pr-3 font-semibold">Promotion</th>
                  <th className="py-3 pr-3 font-semibold">Badge</th>
                  <th className="py-3 pr-3 font-semibold">Min VIP</th>
                  <th className="py-3 pr-3 font-semibold">Window</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-tcl-border-muted/50 align-top">
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-semibold text-tcl-white">{p.title}</p>
                      <p className="line-clamp-2 text-[11px] text-tcl-muted">{p.description}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-pill bg-tcl-red/20 px-2 py-0.5 text-[10px] font-bold uppercase text-tcl-red-bright">
                        {p.badge}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-tcl-muted">{p.minVipLevel}</td>
                    <td className="py-3 pr-3 text-[11px] text-tcl-muted">
                      {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={cn(
                        "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase",
                        p.isActive ? "bg-tcl-success/20 text-tcl-success" : "bg-tcl-muted/10 text-tcl-muted",
                      )}>
                        {p.isActive ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/promotions/${p.id}/edit`}
                        className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 py-1 text-[11px] font-semibold text-tcl-white hover:border-tcl-gold/40"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-tcl-muted">
                      No promotions yet. <Link href="/admin/promotions/new" className="text-tcl-gold hover:underline">Create the first one.</Link>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </NeonCard>
      )}

      <p className="text-[11px] text-tcl-muted">
        All CRUD operations go through <code className="text-tcl-white">/api/admin/promotions/*</code>, which proxy to <code className="text-tcl-white">POST /api/v1/promotions</code>, <code className="text-tcl-white">PATCH /api/v1/promotions/:id</code>, and <code className="text-tcl-white">DELETE /api/v1/promotions/:id</code>. Backend enforces <code className="text-tcl-white">@Roles(Role.ADMIN)</code>.
      </p>
    </div>
  );
}
