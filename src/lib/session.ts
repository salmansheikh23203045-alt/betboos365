import "server-only";
import { cookies } from "next/headers";
import { backendFetch, readBackendError } from "./api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  readAccessToken,
  readRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "./auth-cookies";

export type Role = "user" | "vip" | "moderator" | "admin" | "super_admin";

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  roles: Role[];
}

type TokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

async function tryRefresh(refreshToken: string): Promise<TokensResponse | null> {
  const res = await backendFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: TokensResponse };
  return body.data ?? null;
}

async function fetchMe(accessToken: string): Promise<SessionUser | null> {
  const res = await backendFetch("/users/me", { accessToken });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: SessionUser };
  return body.data ?? null;
}

/**
 * Returns the authenticated session from the current request's HttpOnly
 * cookies, refreshing transparently if the access token has expired. Call
 * from server components, route handlers, and server actions only.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  const rt = readRefreshToken(cookieStore);

  if (at) {
    const me = await fetchMe(at);
    if (me) return me;
  }

  if (!rt) return null;

  const refreshed = await tryRefresh(rt);
  if (!refreshed) {
    // The refresh token is stale/revoked. Wipe cookies so subsequent
    // requests aren't stuck trying it forever.
    cookieStore.delete(ACCESS_COOKIE);
    cookieStore.delete(REFRESH_COOKIE);
    return null;
  }

  setAuthCookies(cookieStore, refreshed);
  return refreshed.user;
}

/**
 * Lower-level helper for BFF route handlers that need the access token to
 * call a protected backend endpoint. Handles one refresh attempt before
 * giving up.
 */
export async function withAuthedBackend<T>(
  perform: (accessToken: string) => Promise<Response>,
): Promise<
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string }
> {
  const cookieStore = await cookies();
  let at = readAccessToken(cookieStore);
  const rt = readRefreshToken(cookieStore);

  async function run(token: string) {
    const res = await perform(token);
    if (res.status !== 401) return res;
    if (!rt) return res;
    const refreshed = await tryRefresh(rt);
    if (!refreshed) {
      clearAuthCookies(cookieStore);
      return res;
    }
    setAuthCookies(cookieStore, refreshed);
    at = refreshed.accessToken;
    return perform(refreshed.accessToken);
  }

  if (!at) {
    if (!rt) return { ok: false, status: 401, error: "Not authenticated" };
    const refreshed = await tryRefresh(rt);
    if (!refreshed) {
      clearAuthCookies(cookieStore);
      return { ok: false, status: 401, error: "Session expired" };
    }
    setAuthCookies(cookieStore, refreshed);
    at = refreshed.accessToken;
  }

  const res = await run(at);
  if (!res.ok) {
    const err = await readBackendError(res);
    return { ok: false, status: err.status, error: err.message };
  }
  const body = (await res.json()) as { data?: T };
  return { ok: true, status: res.status, data: body.data as T };
}
