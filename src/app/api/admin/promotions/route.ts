import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { withAuthedBackend } from "@/lib/session";

// POST /api/admin/promotions — create a new promotion (proxies to backend).
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch("/promotions", {
      method: "POST",
      accessToken,
      body: JSON.stringify(payload),
    }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data }, { status: 201 });
}
