import { redirect } from "next/navigation";
import { backendFetch, readBackendError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { readAccessToken } from "@/lib/auth-cookies";
import { ProfileClient } from "./ProfileClient";
import type { ProfileData } from "./ProfileClient";

async function fetchProfile(accessToken: string): Promise<ProfileData | null> {
  const res = await backendFetch("/profiles/me", { accessToken });
  if (!res.ok) {
    const err = await readBackendError(res);
    console.error("[profile] /profiles/me failed", err);
    return null;
  }
  const body = (await res.json()) as { data?: ProfileData };
  return body.data ?? null;
}

export default async function ProfilePage() {
  // Middleware guarantees a session cookie exists; getSession() here
  // refreshes stale access tokens before we hit the profile endpoint.
  const user = await getSession();
  if (!user) redirect("/login?next=/profile");

  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  // getSession() just set/validated the access cookie; `at` is always
  // defined when we reach this line, but guard anyway for TS.
  const profile = at ? await fetchProfile(at) : null;

  return <ProfileClient user={user} profile={profile} />;
}
