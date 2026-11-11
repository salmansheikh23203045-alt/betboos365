import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { withAuthedBackend } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search;
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`/admin/finance/deposits${qs}`, { accessToken }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data });
}
