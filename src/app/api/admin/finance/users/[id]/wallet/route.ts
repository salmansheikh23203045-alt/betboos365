import { forward, isUuid, notFound } from "@/lib/bff";

/** One player's wallet and recent ledger (transactions.view). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();
  return forward(req, `/admin/finance/users/${id}/wallet`);
}
