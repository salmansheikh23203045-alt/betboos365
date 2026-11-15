import "server-only";
import { NextResponse } from "next/server";
import { backendFetch } from "./api";
import { withAuthedBackend } from "./session";

/**
 * Forward a BFF route to one backend path with the caller's session.
 * The route handler decides the path (never the client), and the backend
 * decides whether the caller is allowed: this adds no authority of its own.
 */
export async function forward(
  req: Request,
  backendPath: string,
  opts: { method?: string; withQuery?: boolean; successStatus?: number } = {},
) {
  const method = opts.method ?? req.method;
  let body: string | undefined;
  if (method !== "GET") {
    let payload: unknown = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    body = JSON.stringify(payload);
  }
  const qs = opts.withQuery ? new URL(req.url).search : "";
  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch(`${backendPath}${qs}`, { method, accessToken, body }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json({ data: result.data }, { status: opts.successStatus ?? 200 });
}

export const notFound = () => NextResponse.json({ message: "Not found" }, { status: 404 });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);
