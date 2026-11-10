import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/api";
import {
  clearAuthCookies,
  readRefreshToken,
} from "@/lib/auth-cookies";

export async function POST() {
  const cookieStore = await cookies();
  const rt = readRefreshToken(cookieStore);

  // Clear cookies locally no matter what the backend says — the user's
  // intent is to log out of this browser session.
  clearAuthCookies(cookieStore);

  if (rt) {
    // Fire-and-forget: revoke on the server, but don't block the logout UX
    // if it fails. Any failure here is a backend problem; the client is
    // already logged out.
    try {
      await backendFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: rt }),
      });
    } catch {
      /* intentional: logout is idempotent on this side */
    }
  }

  return NextResponse.json({ ok: true });
}
