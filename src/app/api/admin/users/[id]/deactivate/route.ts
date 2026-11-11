import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { withAuthedBackend } from "@/lib/session";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`/admin/users/${encodeURIComponent(id)}/deactivate`, {
      method: "PATCH",
      accessToken,
    }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data });
}
