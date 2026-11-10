import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

/**
 * Edge-runtime RBAC gate (Next.js 16 `proxy.ts` convention).
 *
 * - /profile/*  → requires any valid session cookie
 * - /admin/*    → requires the access token to carry the `admin` or
 *                 `super_admin` role
 *
 * We only inspect the JWT payload here (no network/DB call from the edge),
 * which is fine for a first-line gate: every protected server component and
 * route handler re-validates against the backend before trusting the role.
 * If the access token is missing or unreadable but a refresh token exists,
 * we let the request through — the server component layer will refresh and
 * re-check. Only outright-unauthenticated users get bounced here.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function hasAdminRole(payload: Record<string, unknown> | null): boolean {
  if (!payload) return false;
  const roles = payload.roles;
  if (!Array.isArray(roles)) return false;
  return roles.includes("admin") || roles.includes("super_admin");
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const at = req.cookies.get(ACCESS_COOKIE)?.value;
  const rt = req.cookies.get(REFRESH_COOKIE)?.value;
  const hasSession = Boolean(at || rt);

  if (pathname.startsWith("/admin")) {
    if (!hasSession) return redirectToLogin(req, pathname + search);
    const payload = at ? decodeJwtPayload(at) : null;
    if (!payload) {
      if (!rt) return redirectToLogin(req, pathname + search);
      return NextResponse.next();
    }
    if (!hasAdminRole(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/profile")) {
    if (!hasSession) return redirectToLogin(req, pathname + search);
    return NextResponse.next();
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest, next: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
};
