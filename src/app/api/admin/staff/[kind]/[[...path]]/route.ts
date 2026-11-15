import { forward, isUuid, notFound } from "@/lib/bff";

// Agent Management and Sub Admin Management.
//   /api/admin/staff/agents            GET list, POST create
//   /api/admin/staff/agents/:id        PATCH details
//   /api/admin/staff/agents/:id/<sub>  see SUB below
//   /api/admin/staff/agents/:id/players            GET list, POST assign {username}
//   /api/admin/staff/agents/:id/players/:playerId  DELETE unassign
// (same under /sub-admins). The backend enforces who may call these.
const KINDS = new Set(["agents", "sub-admins"]);
const SUB: Record<string, string[]> = {
  GET: ["activity", "withdrawals", "players"],
  POST: ["reset-password", "players"],
  PATCH: ["status"],
  PUT: ["permissions"],
};

type Ctx = { params: Promise<{ kind: string; path?: string[] }> };

async function handle(req: Request, ctx: Ctx) {
  const { kind, path = [] } = await ctx.params;
  if (!KINDS.has(kind)) return notFound();
  const base = `/admin/${kind}`;
  const method = req.method;

  if (path.length === 0) {
    if (method === "GET") return forward(req, base);
    if (method === "POST") return forward(req, base, { successStatus: 201 });
    return notFound();
  }
  const [id, sub, third] = path;
  if (path.length === 3) {
    // Only: DELETE agents/:id/players/:playerId
    if (kind !== "agents" || method !== "DELETE" || sub !== "players" || !isUuid(id) || !isUuid(third)) return notFound();
    return forward(req, `${base}/${id}/players/${third}`, { method: "DELETE" });
  }
  if (!isUuid(id) || path.length > 2) return notFound();
  if (path.length === 1) {
    return method === "PATCH" ? forward(req, `${base}/${id}`) : notFound();
  }
  if (!SUB[method]?.includes(sub)) return notFound();
  if (sub === "withdrawals" && kind !== "agents") return notFound();
  if (sub === "permissions" && kind !== "sub-admins") return notFound();
  if (sub === "players" && kind !== "agents") return notFound();
  return forward(req, `${base}/${id}/${sub}`, { withQuery: method === "GET" });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
