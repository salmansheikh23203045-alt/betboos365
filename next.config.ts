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
    "/api/v1/[[...slug]]/route": [
      "./server/dist/**/*",
      "./server/node_modules/**/*",
      "./server/prisma/schema.prisma",
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
