# syntax=docker/dockerfile:1.7
# -------- builder --------
# Multi-stage build so the runtime image carries only the compiled dist/,
# node_modules installed with --omit=dev, and the generated Prisma client.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build-time deps for Prisma engines (OpenSSL etc.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install all deps (including dev) so nest build + prisma generate work.
COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# -------- runner --------
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# OpenSSL for Prisma query engine at runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

# Non-root runtime user. The base node image already provides `node` (uid 1000).
USER node

COPY --chown=node:node package.json package-lock.json* ./
# Production-only deps. `prisma` CLI stays because we run `prisma migrate
# deploy` at container start; it's a small cost for simpler ops.
RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=node:node prisma ./prisma

# Railway sets $PORT; we bind to 0.0.0.0 inside main.ts. EXPOSE is advisory.
EXPOSE 3200

# tini reaps zombies so Prisma's spawned engines don't leak PIDs.
ENTRYPOINT ["/usr/bin/tini", "--"]

# Apply any pending migrations, then start the API. `prisma migrate deploy`
# is safe to run on every boot — it only applies NEW migrations and skips
# ones already recorded in the `_prisma_migrations` table.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
