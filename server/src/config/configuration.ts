export default () => ({
  port: parseInt(process.env.PORT ?? '3200', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiration: process.env.JWT_EXPIRATION ?? '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  sports: {
    provider: process.env.SPORTS_API_PROVIDER ?? 'mock',
    apiKey: process.env.SPORTS_API_KEY ?? '',
    baseUrl: process.env.SPORTS_API_BASE_URL ?? '',
  },
  logLevel: process.env.LOG_LEVEL ?? 'debug',
});
