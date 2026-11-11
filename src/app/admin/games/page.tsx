import type { Metadata } from "next";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { GameToggleCell } from "./GameToggleCell";

export const metadata: Metadata = { title: "Games & Providers | TCL11 Admin" };
export const dynamic = "force-dynamic";

interface GameRow {
  id: string;
  title: string;
  provider: string;
  category: string;
  isActive: boolean;
  isFree?: boolean;
}

async function fetchList<T>(path: string): Promise<T[] | null> {
  try {
    const res = await backendFetch(path);
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: unknown };
    if (Array.isArray(body.data)) return body.data as T[];
    if (body.data && typeof body.data === "object" && "data" in body.data) {
      const inner = (body.data as { data: unknown }).data;
      return Array.isArray(inner) ? (inner as T[]) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function AdminGamesPage() {
  const [games, categories, providers] = await Promise.all([
    fetchList<GameRow>("/games"),
    fetchList<string>("/games/categories"),
    fetchList<string>("/games/providers"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Games &amp; Providers</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <NeonCard className="flex items-center gap-3 p-4">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-tcl-gold/10 text-tcl-gold">
            <ICONS.Gamepad2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase text-tcl-muted">Games in catalog</p>
            <p className="font-display text-heading-md text-tcl-white">{games?.length ?? "—"}</p>
          </div>
        </NeonCard>
        <NeonCard className="flex items-center gap-3 p-4">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-tcl-red/10 text-tcl-red-bright">
            <ICONS.Layers aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase text-tcl-muted">Categories</p>
            <p className="font-display text-heading-md text-tcl-white">{categories?.length ?? "—"}</p>
          </div>
        </NeonCard>
        <NeonCard className="flex items-center gap-3 p-4">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-tcl-success/10 text-tcl-success">
            <ICONS.Shield aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase text-tcl-muted">Providers</p>
            <p className="font-display text-heading-md text-tcl-white">{providers?.length ?? "—"}</p>
          </div>
        </NeonCard>
      </div>

      <NeonCard className="space-y-3 p-4">
        <h3 className="font-display text-heading-md uppercase text-tcl-white">Game Catalog</h3>
        {!games ? (
          <p className="text-tcl-red-bright">Backend unreachable.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="pb-2 pr-3 font-semibold">Title</th>
                  <th className="pb-2 pr-3 font-semibold">Category</th>
                  <th className="pb-2 pr-3 font-semibold">Provider</th>
                  <th className="pb-2 pr-3 font-semibold">Mode</th>
                  <th className="pb-2 font-semibold">Active</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-tcl-border-muted/50">
                    <td className="py-2.5 pr-3 text-tcl-white">{g.title}</td>
                    <td className="py-2.5 pr-3 text-tcl-muted">{g.category}</td>
                    <td className="py-2.5 pr-3 text-tcl-muted">{g.provider ?? "—"}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${g.isFree ? "bg-tcl-success/20 text-tcl-success" : "bg-tcl-gold/10 text-tcl-gold"}`}>
                        {g.isFree ? "Free" : "Paid"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <GameToggleCell id={g.id} initialActive={g.isActive} title={g.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-tcl-muted">
          Only the <strong className="text-tcl-white">active</strong> toggle is wired to the backend
          (<code className="text-tcl-white">PATCH /api/v1/games/:id</code>). Public <code className="text-tcl-white">GET /games</code>
          filters by <code className="text-tcl-white">isActive=true</code>, so turning a game off
          hides it from players immediately. Full CRUD (create new games, change title,
          swap provider) is deferred until a seeded-content review step.
        </p>
      </NeonCard>
    </div>
  );
}
