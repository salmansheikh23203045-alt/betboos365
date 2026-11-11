import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { withAuthedBackend } from "@/lib/session";

const ALLOWED = new Set(["approve", "reject"]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await ctx.params;
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  }
  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`/admin/finance/deposits/${encodeURIComponent(id)}/${action}`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data });
}
