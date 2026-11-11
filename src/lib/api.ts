import "server-only";

const DEFAULT_BACKEND = "http://localhost:3200/api/v1";

// On Vercel the NestJS backend is mounted at /api/v1 inside this very
// project, so the BFF should call itself rather than an external URL.
// We prefer the explicit env var when set, then the Vercel URL, then
// the local dev fallback.
function resolveBase(): string {
  if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;
  return DEFAULT_BACKEND;
}

export function backendUrl(path: string): string {
  const base = resolveBase();
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

  try {
    return await fetch(backendUrl(path), {
      ...rest,
      headers: finalHeaders,
      cache: "no-store",
    });
  } catch (err) {
    // ECONNREFUSED / ENOTFOUND / aborted / DNS: the backend is unreachable.
    // Return a synthetic 503 Response so callers that branch on `.ok` stay on
    // their existing graceful-failure path instead of taking down the page.
    const message =
      err instanceof Error ? err.message : "Backend unreachable";
    return new Response(
      JSON.stringify({ message: `Backend unreachable: ${message}` }),
      {
        status: 503,
        headers: { "content-type": "application/json" },
      },
    );
  }
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
