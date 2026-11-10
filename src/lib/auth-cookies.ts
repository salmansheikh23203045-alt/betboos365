import type { ResponseCookies, RequestCookies } from "next/dist/server/web/spec-extension/cookies";

export const ACCESS_COOKIE = "tcl_at";
export const REFRESH_COOKIE = "tcl_rt";

// Backend-issued access tokens are JWTs that expire in 15 min. We keep the
// cookie slightly longer (16 min) so a near-expiry token still rides the BFF
// through its one refresh retry; the JWT's own `exp` claim remains the source
// of truth for validity.
const ACCESS_MAX_AGE = 60 * 16;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

type AnyCookies = ResponseCookies | {
  set: (opts: { name: string; value: string; [k: string]: unknown }) => unknown;
  delete: (name: string) => unknown;
};

export function setAuthCookies(
  cookies: AnyCookies,
  tokens: { accessToken: string; refreshToken: string },
) {
  const secure = process.env.NODE_ENV === "production";
  cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(cookies: AnyCookies) {
  cookies.delete(ACCESS_COOKIE);
  cookies.delete(REFRESH_COOKIE);
}

export function readAccessToken(cookies: RequestCookies | { get: (name: string) => { value: string } | undefined }): string | undefined {
  return cookies.get(ACCESS_COOKIE)?.value;
}

export function readRefreshToken(cookies: RequestCookies | { get: (name: string) => { value: string } | undefined }): string | undefined {
  return cookies.get(REFRESH_COOKIE)?.value;
}
