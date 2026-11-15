import { forward, isUuid, notFound } from "@/lib/bff";

/** Manual wallet credit/debit (wallet.adjust). The backend validates and audits. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();
  return forward(req, `/admin/finance/users/${id}/wallet/adjust`);
}
