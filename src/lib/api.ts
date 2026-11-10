import "server-only";

const DEFAULT_BACKEND = "http://localhost:3200/api/v1";

export function backendUrl(path: string): string {
  const base = process.env.BACKEND_API_URL ?? DEFAULT_BACKEND;
  const trimmed = base.replace(/\/+$/, "");
  return `${trimmed}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface BackendError {
  status: number;
  message: string;
  details?: unknown;
}

export async function backendFetch(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const { accessToken, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "content-type": "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };
  if (accessToken) finalHeaders.authorization = `Bearer ${accessToken}`;

  return fetch(backendUrl(path), {
    ...rest,
    headers: finalHeaders,
    cache: "no-store",
  });
}

export async function readBackendError(res: Response): Promise<BackendError> {
  try {
    const body = (await res.json()) as {
      message?: string | string[];
      error?: string;
    };
    const msg = Array.isArray(body.message)
      ? body.message.join("; ")
      : body.message ?? body.error ?? res.statusText;
    return { status: res.status, message: msg, details: body };
  } catch {
    return { status: res.status, message: res.statusText };
  }
}
