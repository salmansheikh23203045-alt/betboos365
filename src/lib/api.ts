import "server-only";
import { handleNestRequest } from "./nest-handler";

const DEFAULT_BACKEND = "http://localhost:3200/api/v1";

// On Vercel the NestJS backend is mounted at /api/v1 inside this very
// project, so the BFF should call itself rather than an external URL.
// Resolution order:
//   1. explicit BACKEND_API_URL env (lets overrides win)
//   2. VERCEL_PROJECT_PRODUCTION_URL — the public production domain,
//      NOT the per-deployment URL. Per-deployment URLs may be
//      protected by Vercel Deployment Protection, which 401s server-
//      to-server calls too.
//   3. VERCEL_URL — per-deployment URL. Works on Preview, may be
//      Auth-protected on Production.
//   4. local dev fallback
function resolveBase(): string {
  if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/v1`;
  }
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

  // If BACKEND_API_URL is not set (e.g. on Vercel serverless runtime),
  // invoke NestJS directly in-process via handleNestRequest to avoid
  // self-referential HTTP network fetching (which fails due to Vercel Auth/timeouts).
  //
  // NOTE: If testing locally with a dedicated NestJS backend, set
  // BACKEND_API_URL=http://localhost:3200/api/v1 to force HTTP usage
  // and avoid the in-process NestJS lifecycle.
  if (!process.env.BACKEND_API_URL) {
    try {
      const fullUrl = `http://localhost/api/v1${path.startsWith("/") ? path : `/${path}`}`;
      const req = new Request(fullUrl, {
        ...rest,
        headers: finalHeaders,
      });
      return await handleNestRequest(req);
    } catch (err) {
      const message = err instanceof Error ? err.message : "In-process backend error";
      const errName = err instanceof Error ? err.name : "Error";
      console.error(`[BFF Error] In-process NestJS request failed for ${path} (${errName}): ${message}`);
      return new Response(
        JSON.stringify({ message: `Backend error (${errName}): ${message}` }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  try {
    return await fetch(backendUrl(path), {
      ...rest,
      headers: finalHeaders,
      cache: "no-store",
    });
  } catch (err) {
    // ECONNREFUSED / ENOTFOUND / aborted / DNS: the backend is unreachable.
    const message = err instanceof Error ? err.message : "Backend unreachable";
    const code = (err as NodeJS.ErrnoException).code ?? "UNKNOWN";
    console.error(`[BFF Error] Network connection failed to backend at ${backendUrl(path)} [Code: ${code}]: ${message}`);
    return new Response(
      JSON.stringify({ message: `Backend unreachable [${code}]: ${message}` }),
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
