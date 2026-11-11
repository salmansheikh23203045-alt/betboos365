// NestJS mount point on Vercel. This file is the ONLY entry Next.js
// exposes for /api/v1/*; it forwards every request through the NestJS
// Express instance that lives in server/.
//
// Pattern notes (verified 2026-11-11):
//   - Next.js 16 route handlers: `params` is now a Promise. We don't use
//     them — the catch-all passes the raw request through to Nest, which
//     has its own routing.
//   - The NestJS app is bootstrapped lazily, once per lambda instance,
//     and cached via a module-scoped promise so a warm invocation reuses
//     the module graph and the Prisma client.
//   - WebSocket (Socket.IO) is NOT functional on Vercel. The gateway is
//     disabled when `process.env.VERCEL` is set — see app.module.ts.

import { handleNestRequest } from "@/lib/nest-handler";

export const runtime = "nodejs";
// Hobby plan cap is 10s. Keep this explicit so the ceiling is obvious.
export const maxDuration = 10;
// Every request must re-evaluate; nothing cacheable here.
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  return handleNestRequest(req);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
  handle as HEAD,
};
