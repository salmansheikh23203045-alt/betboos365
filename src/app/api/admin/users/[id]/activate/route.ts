import { forward, isUuid, notFound } from "@/lib/bff";

/** Reactivate a deactivated account (users.manage). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();
  return forward(req, `/admin/users/${id}/activate`, { method: "PATCH" });
}
