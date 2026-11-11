// Fetch Request <-> Express adapter for the NestJS app.
//
// The NestJS app lives in server/ and is built to server/dist/ by the
// root package.json's postinstall hook. We import the COMPILED module
// (not the TS source) so the Next.js SWC doesn't try to compile NestJS
// decorators. All NestJS packages are externalized in next.config.ts
// so webpack keeps them in node_modules at runtime instead of bundling.

import "reflect-metadata";
import { Socket } from "node:net";
import { IncomingMessage, ServerResponse } from "node:http";
// Static requires for npm packages — these are listed in
// next.config.ts::serverExternalPackages, so webpack leaves them as
// runtime requires AND Vercel's file tracer includes them in the function
// node_modules. DO NOT wrap these in eval(): that would hide them from
// the tracer and the function would ship without @nestjs/core.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { NestFactory } from "@nestjs/core";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";
// eslint-disable-next-line @typescript-eslint/no-require-imports
// @ts-expect-error express has no bundled types; we only use its default export as a callable factory
import express from "express";

// eval('require') IS the escape hatch for the one import the tracer
// genuinely cannot resolve: the compiled Nest module in server/dist/,
// which lives outside Next.js's source tree and is produced by the
// postinstall hook. We pull its parent folder in via outputFileTracingIncludes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeRequire: (id: string) => any = eval("require");

type ExpressRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next?: (err?: unknown) => void,
) => void;

let appPromise: Promise<ExpressRequestHandler> | null = null;

async function getApp(): Promise<ExpressRequestHandler> {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    // Absolute path to the compiled Nest module. server/dist/ is produced
    // by the root package.json postinstall script before next build runs.
    const distModule = `${process.cwd()}/server/dist/app.module.js`;
    const { AppModule } = nodeRequire(distModule);

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      adapter,
      { logger: ["error", "warn"] },
    );
    app.setGlobalPrefix("api/v1");
    app.set("trust proxy", 1);
    // Minimal global pipes/filters are configured inside AppModule's providers
    // via globalPipe tokens — same shape as server/src/main.ts, minus listen().
    await app.init();
    return expressApp;
  })();
  return appPromise;
}

/**
 * Convert a Fetch Request into a Node IncomingMessage the Express stack can read.
 */
function toNodeRequest(request: Request, body: Buffer): IncomingMessage {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  const url = new URL(request.url);
  req.method = request.method;
  req.url = url.pathname + url.search;
  req.headers = {};
  for (const [k, v] of request.headers.entries()) {
    req.headers[k.toLowerCase()] = v;
  }
  if (!req.headers.host) req.headers.host = url.host;
  req.push(body.length ? body : null);
  if (body.length) req.push(null);
  return req;
}

/**
 * ServerResponse variant that captures everything written and resolves a
 * Fetch Response when `.end()` is called.
 */
function createCapturingResponse(
  req: IncomingMessage,
): { res: ServerResponse; promise: Promise<Response> } {
  const chunks: Buffer[] = [];
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((r) => (resolve = r));

  const res = new ServerResponse(req);
  const origWrite = res.write.bind(res);
  const origEnd = res.end.bind(res);

  res.write = function (chunk: unknown, ...args: unknown[]) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    // @ts-expect-error forwarding variadic signature
    return origWrite(chunk, ...args);
  };

  res.end = function (chunk?: unknown, ...args: unknown[]) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    const raw = res.getHeaders();
    for (const [k, v] of Object.entries(raw)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, String(vv)));
      else headers.set(k, String(v));
    }
    resolve(
      new Response(body.length ? body : null, {
        status: res.statusCode,
        statusText: res.statusMessage || undefined,
        headers,
      }),
    );
    // @ts-expect-error forwarding variadic signature
    return origEnd(chunk, ...args);
  };

  return { res, promise };
}

/**
 * Public entry — the catch-all route calls this.
 */
export async function handleNestRequest(request: Request): Promise<Response> {
  const expressApp = await getApp();
  const body = request.body
    ? Buffer.from(await request.arrayBuffer())
    : Buffer.alloc(0);

  const nodeReq = toNodeRequest(request, body);
  const { res, promise } = createCapturingResponse(nodeReq);

  // Express app is callable (req, res, next)
  expressApp(nodeReq, res, (err: unknown) => {
    if (err) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          message: err instanceof Error ? err.message : "Internal error",
        }),
      );
    }
  });

  return promise;
}
