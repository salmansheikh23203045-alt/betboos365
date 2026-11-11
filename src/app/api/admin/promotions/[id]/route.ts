import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { withAuthedBackend } from "@/lib/session";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`/promotions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`/promotions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      accessToken,
    }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data });
}
