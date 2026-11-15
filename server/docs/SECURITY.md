# BetBoos365 Security & Compliance

## Authentication

- **JWT tokens** with 15-minute access token expiry and 7-day refresh tokens.
- Refresh tokens are opaque UUIDs stored server-side (in-memory now, Redis/DB in Step 08).
- Password change invalidates all user refresh tokens.
- Tokens are transmitted as `Bearer` tokens in the `Authorization` header.

## Password Security

- **bcrypt** with 12 salt rounds (adaptive cost factor).
- Password policy enforced via DTO validation:
  - Minimum 8 characters
  - At least one uppercase letter, one lowercase letter, one digit
  - Maximum 64 characters
- Passwords are never logged, returned in responses, or stored in plain text.

## Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `user` | Access own profile, notifications, tickets. Launch games. |
| `vip` | All user permissions + VIP-exclusive promotions. |
| `moderator` | User permissions + view/manage support tickets. |
| `admin` | All permissions + user management, dashboard, audit logs, promotion CRUD. |
| `super_admin` | All admin permissions + system configuration. |

Roles are enforced via the `@Roles()` decorator and `RolesGuard`.

## Input Validation

- All incoming DTOs validated with `class-validator` (whitelist mode, forbid non-whitelisted).
- `class-transformer` for automatic type coercion.
- Global `ValidationPipe` applied at application level.

## API Security

- **Helmet** — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — configurable allowed origins (default: localhost frontend).
- **Rate limiting** — `@nestjs/throttler` with configurable TTL and limit per IP.
- **Global exception filter** — never leaks stack traces or internal details in production.

## Secrets Management

- All secrets loaded from environment variables (`.env` file, never committed).
- `.env.example` provides the template with placeholder values.
- JWT secret must be changed from the dev default before production deployment.
- No API keys or secrets are hardcoded in source code.

## Logging & Audit

- Centralized `AuditService` logs security-relevant events:
  - Authentication: LOGIN, LOGOUT, REGISTER, PASSWORD_CHANGE
  - Account: PROFILE_UPDATE, SETTINGS_CHANGE
  - Admin: ADMIN_ACTION (role changes, deactivation)
  - Application: GAME_LAUNCH, PROMOTION_CLAIM, SUPPORT_TICKET
- Each log entry captures: user ID, action, metadata, IP address, user-agent, timestamp.
- `LoggingInterceptor` logs all HTTP requests with method, path, and response time.
- Server errors (5xx) include stack traces in logs; client errors (4xx) log warnings only.

## Compliance Requirements (Planned)

- **Age Verification** — 18+ enforcement at registration (Step 08).
- **KYC** — Identity verification before withdrawals (Step 08+).
- **Responsible Gaming** — Deposit limits, loss limits, session reminders, self-exclusion (Step 08+).
- **Data Protection** — GDPR-aligned data access/deletion rights (Step 08+).
- **Geo-blocking** — Jurisdiction-based access control (Step 08+).

## WebSocket Security

- Socket.IO namespace `/ws` accepts connections from CORS-allowed origins.
- Authentication via `authenticate` event with user ID (JWT validation planned for Step 08).
- Room-based isolation: users receive only their own notifications and subscribed sports updates.

## Production Checklist (Before Go-Live)

- [ ] Change JWT_SECRET to a cryptographically secure random value (≥32 characters)
- [ ] Enable HTTPS/TLS termination
- [ ] Set NODE_ENV=production
- [ ] Configure Redis with authentication
- [ ] Set restrictive CORS origins
- [ ] Enable database connection pooling
- [ ] Set up log aggregation (ELK/CloudWatch)
- [ ] Configure rate limits for auth endpoints
- [ ] Implement CSRF protection for cookie-based auth (if used)
- [ ] Set up monitoring and alerting
