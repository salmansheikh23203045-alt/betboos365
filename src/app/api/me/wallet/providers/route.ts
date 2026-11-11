import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";

export async function GET() {
  const res = await backendFetch("/wallet/providers");
  if (!res.ok) {
    return NextResponse.json({ message: "Unable to load providers" }, { status: res.status });
  }
  const body = (await res.json()) as { data?: unknown };
  return NextResponse.json({ data: body.data ?? [] });
}
