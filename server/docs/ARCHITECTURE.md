# BetBoos365 Backend Architecture

## Overview

The BetBoos365 backend is a modular NestJS application providing REST APIs and WebSocket real-time communication for the BetBoos365 online gaming platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Next.js Frontend (port 3000/3100)  │  Mobile Apps (future)   │
└──────────────┬──────────────────────────┬───────────────────────┘
               │ HTTP/REST                │ WebSocket (Socket.IO)
               ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────┐ ┌─────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │  Helmet   │ │ Rate Limiter│ │  CORS     │ │  Validation  │  │
│  └──────────┘ └─────────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────────────────┐  ┌─────────────────────────────┐     │
│  │  JWT Auth Guard      │  │  Global Exception Filter    │     │
│  └──────────────────────┘  └─────────────────────────────┘     │
│  ┌──────────────────────┐  ┌─────────────────────────────┐     │
│  │  Roles Guard (RBAC)  │  │  Logging + Transform        │     │
│  └──────────────────────┘  └─────────────────────────────┘     │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │   Auth   │ │  Users   │ │ Profiles │ │     Games        │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Sports  │ │  Promos  │ │ Notifs   │ │    Support       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────┐                                    │
│  │  Admin   │ │  Audit   │                                    │
│  └──────────┘ └──────────┘                                    │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  In-Memory Store  │  │  PostgreSQL + Prisma (Step 08)    │  │
│  │  (current mock)   │  │  (planned replacement)             │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  Redis Cache      │  │  External Sports API Adapters     │  │
│  │  (architecture)   │  │  (mock adapter active)             │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Framework | NestJS | 11.x |
| Language | TypeScript | 5.9 |
| Auth | Passport + JWT | passport-jwt 4.x |
| Validation | class-validator + class-transformer | 0.14 / 0.5 |
| WebSocket | Socket.IO (via @nestjs/websockets) | 11.x |
| API Docs | Swagger (@nestjs/swagger) | 11.x |
| Security | Helmet + @nestjs/throttler | 8.x / 6.x |
| Hashing | bcrypt | 6.x |
| Cache | ioredis (architecture ready) | 5.x |
| Database | In-memory Maps (PostgreSQL + Prisma in Step 08) | — |

## Module Architecture

### 1. Auth Module (`/auth`)
- JWT-based authentication with access + refresh tokens
- Passport strategy for token validation
- Public/private route decoration
- bcrypt password hashing (12 salt rounds)

### 2. Users Module (`/users`)
- User CRUD with in-memory store (Prisma in Step 08)
- Role management (USER, VIP, MODERATOR, ADMIN, SUPER_ADMIN)
- Self-service `/me` endpoints
- Admin-only user listing and lookup

### 3. Profiles Module (`/profiles`)
- Extended user profile (display name, avatar, preferences)
- Currency, language, timezone settings
- VIP level tracking
- Gaming statistics aggregation

### 4. Games Module (`/games`)
- Game catalogue with category/provider filtering
- Search by title
- Game launch tracking
- Category and provider listing

### 5. Sports Module (`/sports`)
- External API adapter pattern (strategy/provider interface)
- Mock adapter with realistic match data
- Live score filtering
- Sport type enumeration
- Designed for swapping providers (e.g., Sportradar, Betfair)

### 6. Promotions Module (`/promotions`)
- Promotion CRUD (admin-only create)
- VIP level eligibility filtering
- Active/inactive management
- Date-range validity

### 7. Notifications Module (`/notifications`)
- WebSocket gateway (Socket.IO, `/ws` namespace)
- Per-user notification channels
- Sports event subscription rooms
- In-memory notification store with read/unread tracking
- Real-time push on create

### 8. Support Module (`/support`)
- Ticket system (create, reply, status management)
- Contact form (public, no auth required)
- Ticket priority levels (LOW, MEDIUM, HIGH, URGENT)
- Status workflow (OPEN → IN_PROGRESS → WAITING → RESOLVED → CLOSED)
- Agent/admin ticket listing

### 9. Admin Module (`/admin`)
- Dashboard statistics aggregation
- User role management
- User deactivation
- Audit log access

### 10. Audit Module (`/audit`)
- Global audit event logging
- Action types: LOGIN, LOGOUT, REGISTER, PASSWORD_CHANGE, PROFILE_UPDATE, GAME_LAUNCH, PROMOTION_CLAIM, ADMIN_ACTION, SUPPORT_TICKET, SETTINGS_CHANGE
- IP address and user-agent capture
- User-scoped and action-scoped queries

## Redis Architecture (Planned)

Redis will serve three purposes once connected:

1. **Session/Token Store** — Refresh token storage (replacing in-memory Map)
2. **Cache Layer** — Game catalogue, promotion listings, sports events
3. **Pub/Sub** — Cross-instance WebSocket event propagation

The `ioredis` dependency is included. Connection config is in `.env`. Integration is deferred to Step 08 alongside PostgreSQL.

## WebSocket Architecture

```
Client connects → ws://server:3200/ws
  │
  ├─ emit('authenticate', {userId}) → joins room user:{userId}
  │
  ├─ emit('subscribe:sports', {eventIds}) → joins rooms sport:{id}
  │
  └─ receives:
       ├─ 'notification' — personal notifications
       └─ 'sport:update' — live score changes
```

## Security Measures

See `SECURITY.md` for full details.
