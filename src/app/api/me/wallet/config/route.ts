import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";

export async function GET() {
  const res = await backendFetch("/wallet/config");
  if (!res.ok) {
    return NextResponse.json({ message: "Unable to load config" }, { status: res.status });
  }
  const body = (await res.json()) as { data?: unknown };
  return NextResponse.json({ data: body.data ?? null });
}
