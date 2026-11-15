import { forward, isUuid, notFound } from "@/lib/bff";

// Agent Dashboard API. Only these backend routes are reachable from here:
//   GET  summary | withdrawals | activity | report | players | players/:id
//        wallet | wallet/withdrawals            (the agent's own wallet)
//   POST wallet/withdrawals                       (the agent's own withdrawal)
//   POST withdrawals/:id/complete | withdrawals/:id/return
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  if (path.length === 1 && ["summary", "withdrawals", "activity", "report", "players"].includes(path[0])) {
    return forward(req, `/agent/${path[0]}`, { withQuery: true });
  }
  if (path.length === 1 && path[0] === "wallet") return forward(req, "/agent/wallet");
  if (path.length === 2 && path[0] === "wallet" && path[1] === "withdrawals") {
    return forward(req, "/agent/wallet/withdrawals", { withQuery: true });
  }
  if (path.length === 2 && path[0] === "players" && isUuid(path[1])) {
    return forward(req, `/agent/players/${path[1]}`);
  }
  return notFound();
}

export async function POST(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  if (path.length === 2 && path[0] === "wallet" && path[1] === "withdrawals") {
    return forward(req, "/agent/wallet/withdrawals", { successStatus: 201 });
  }
  if (
    path.length === 3 &&
    path[0] === "withdrawals" &&
    isUuid(path[1]) &&
    (path[2] === "complete" || path[2] === "return")
  ) {
    return forward(req, `/agent/withdrawals/${path[1]}/${path[2]}`);
  }
  return notFound();
}
