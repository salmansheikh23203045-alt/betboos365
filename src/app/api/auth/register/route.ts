import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, readBackendError } from "@/lib/api";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // Strip spaces from phone before the backend's strict regex.
  if (typeof payload.phone === "string") {
    payload.phone = payload.phone.replace(/\s+/g, "");
  }
  // Drop email if blank so the backend's IsOptional+IsEmail doesn't reject "".
  if (typeof payload.email === "string" && payload.email.trim() === "") {
    delete payload.email;
  }

  const res = await backendFetch("/auth/register", {
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

  return NextResponse.json({ user: body.data.user }, { status: 201 });
}
