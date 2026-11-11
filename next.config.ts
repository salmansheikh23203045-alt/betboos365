import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // NestJS and its deps use runtime reflection + dynamic requires + native
  // addons that don't bundle with webpack. Keep them external at runtime so
  // the serverless function loads them from node_modules the standard way.
  serverExternalPackages: [
    "@nestjs/core",
    "@nestjs/common",
    "@nestjs/config",
    "@nestjs/jwt",
    "@nestjs/passport",
    "@nestjs/platform-express",
    "@nestjs/platform-socket.io",
    "@nestjs/swagger",
    "@nestjs/throttler",
    "@nestjs/websockets",
    "@prisma/client",
    ".prisma/client",
    "prisma",
    "bcrypt",
    "class-transformer",
    "class-validator",
    "helmet",
    "ioredis",
    "passport",
    "passport-jwt",
    "reflect-metadata",
    "uuid",
    "express",
  ],
  // Make sure the compiled NestJS app + Prisma engines + schema are traced
  // into the serverless function bundle.
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    // The catch-all uses eval('require') to load Nest at runtime; webpack
    // cannot see those requires, so Next.js's file tracer leaves the
    // packages out of the function bundle. We pull them in explicitly.
    "/api/v1/[[...slug]]/route": [
      "./server/dist/**/*",
      "./server/node_modules/**/*",
      "./server/prisma/schema.prisma",
      "./node_modules/@nestjs/**/*",
      "./node_modules/@prisma/**/*",
      "./node_modules/.prisma/**/*",
      "./node_modules/bcrypt/**/*",
      "./node_modules/class-transformer/**/*",
      "./node_modules/class-validator/**/*",
      "./node_modules/helmet/**/*",
      "./node_modules/ioredis/**/*",
      "./node_modules/passport/**/*",
      "./node_modules/passport-jwt/**/*",
      "./node_modules/reflect-metadata/**/*",
      "./node_modules/uuid/**/*",
      "./node_modules/express/**/*",
      "./node_modules/rxjs/**/*",
      "./node_modules/tslib/**/*",
      "./node_modules/iterare/**/*",
      "./node_modules/path-to-regexp/**/*",
      "./node_modules/body-parser/**/*",
      "./node_modules/cookie/**/*",
      "./node_modules/raw-body/**/*",
      "./node_modules/socket.io/**/*",
      "./node_modules/jsonwebtoken/**/*",
      "./node_modules/jws/**/*",
      "./node_modules/jwa/**/*",
    ],
  },
};

export default nextConfig;
