import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/api";
import { clearAuthCookies } from "@/lib/auth-cookies";
import { withAuthedBackend } from "@/lib/session";

/**
 * Change the signed-in account's password. The backend verifies the current
 * password, enforces the password policy, clears any temporary-password flag
 * and revokes every session, so this browser's cookies are cleared on success
 * and the user signs in again with the new password.
 */
export async function POST(req: Request) {
  let payload: { currentPassword?: unknown; newPassword?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const body = JSON.stringify({
    currentPassword: typeof payload.currentPassword === "string" ? payload.currentPassword : "",
    newPassword: typeof payload.newPassword === "string" ? payload.newPassword : "",
  });

  const result = await withAuthedBackend<unknown>((accessToken) =>
    backendFetch("/auth/change-password", { method: "POST", accessToken, body }),
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
  return NextResponse.json({ ok: true });
}
