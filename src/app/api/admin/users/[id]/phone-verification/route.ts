import { forward, isUuid, notFound } from "@/lib/bff";

/** Mark a player's registered phone number as verified (or revoke it). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();
  return forward(req, `/admin/users/${id}/phone-verification`);
}
