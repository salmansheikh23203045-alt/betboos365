import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";
import { canUseAdminDashboard, homeFor, isAgent, isRestrictedStaff, isSuperAdmin } from "@/lib/roles";

/**
 * Edge-runtime RBAC gate (Next.js 16 `proxy.ts` convention).
 *
 * - /admin/*    → Admin, Super Admin or Sub Admin
 * - /agent/*    → Agent
 * - /change-password → any signed-in account; an account still on a
 *                 temporary password is sent here from every gated path
 * - /profile/*  → any signed-in player; Admin, Sub Admin and Agent accounts
 *                 have no profile and are sent to their own dashboard
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

function rolesOf(payload: Record<string, unknown> | null): string[] | null {
  if (!payload || !Array.isArray(payload.roles)) return null;
  return payload.roles.filter((r): r is string => typeof r === "string");
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const at = req.cookies.get(ACCESS_COOKIE)?.value;
  const rt = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!at && !rt) return redirectToLogin(req, pathname + search);

  const roles = at ? rolesOf(decodeJwtPayload(at)) : null;
  // No readable access token but a refresh token: the server layer refreshes and re-checks.
  if (!roles) return rt ? pass(req, pathname) : redirectToLogin(req, pathname + search);

  // Temporary password: only the change form is reachable (the API enforces the same).
  const mustChange = decodeJwtPayload(at!)?.pwc === true;
  if (pathname === "/change-password") return pass(req, pathname);
  if (mustChange) return redirectTo(req, "/change-password");

  if (pathname.startsWith("/admin")) {
    if (!canUseAdminDashboard(roles)) return redirectTo(req, isAgent(roles) ? "/agent" : "/");
    return pass(req, pathname);
  }

  if (pathname.startsWith("/agent")) {
    if (!isAgent(roles) || isSuperAdmin(roles)) {
      return redirectTo(req, canUseAdminDashboard(roles) ? "/admin" : "/");
    }
    return pass(req, pathname);
  }

  if (pathname.startsWith("/profile") && isRestrictedStaff(roles)) {
    return redirectTo(req, homeFor(roles));
  }

  return pass(req, pathname);
}

/** Forward the pathname so server layouts can gate per section. */
function pass(req: NextRequest, pathname: string) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function redirectToLogin(req: NextRequest, next: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/agent/:path*", "/change-password"],
};
