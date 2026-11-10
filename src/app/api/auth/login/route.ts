import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, readBackendError } from "@/lib/api";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const res = await backendFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await readBackendError(res);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }

  const body = (await res.json()) as {
    data: {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        username: string;
        email: string | null;
        firstName: string;
        lastName: string;
        roles: string[];
      };
    };
  };

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
  });

  return NextResponse.json({ user: body.data.user });
}
