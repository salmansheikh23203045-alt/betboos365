# TCL11 Database Architecture

## Overview

TCL11 uses **PostgreSQL** as its primary database with **Prisma ORM 6.9** for type-safe database access. All data that was previously stored in in-memory Maps is now persisted in PostgreSQL through Prisma.

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Database | PostgreSQL | 15+ |
| ORM | Prisma | 6.9.0 |
| Client | @prisma/client | 6.9.0 |
| Integration | PrismaModule (global) | NestJS 11.x |

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS & AUTH                              │
│                                                                  │
│  ┌──────────┐     1:1     ┌──────────────┐                      │
│  │  users   │────────────▶│ user_profiles │                      │
│  │          │             └──────────────┘                      │
│  │  id (PK) │                                                    │
│  │  email   │     1:N     ┌────────────────┐                     │
│  │  roles[] │────────────▶│ refresh_tokens │                     │
│  └──────────┘             └────────────────┘                     │
│       │                                                          │
│       │ 1:N                                                      │
│       ├──────────────────▶ notifications                         │
│       ├──────────────────▶ support_tickets ──1:N──▶ ticket_msgs  │
│       ├──────────────────▶ ticket_messages (sender)              │
│       ├──────────────────▶ audit_logs                            │
│       ├──────────────────▶ user_promotions ◀──N:1── promotions   │
│       └──────────────────▶ game_launches ◀──N:1──── games        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       GAMES & PROVIDERS                          │
│                                                                  │
│  ┌────────────────┐   1:N    ┌─────────┐                        │
│  │ game_providers │─────────▶│  games  │                        │
│  └────────────────┘          └─────────┘                        │
│                                  │ 1:N                           │
│                                  ▼                               │
│                          ┌──────────────┐                        │
│                          │ game_launches│                        │
│                          └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SPORTS & MATCHES                               │
│                                                                  │
│  ┌────────┐  1:N  ┌─────────┐  1:N  ┌──────────────┐           │
│  │ sports │──────▶│ leagues │──────▶│ sport_matches│           │
│  └────────┘       └─────────┘       └──────────────┘           │
│                                          ▲     ▲                │
│                    ┌───────┐             │     │                │
│                    │ teams │─── HomeTeam─┘     │                │
│                    │       │─── AwayTeam───────┘                │
│                    └───────┘                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STANDALONE TABLES                              │
│                                                                  │
│  contact_submissions  (public contact form, no FK to users)      │
└─────────────────────────────────────────────────────────────────┘
```

## Models (15 total)

| Model | Table | Description |
|-------|-------|-------------|
| User | `users` | Core user accounts: `username` (unique, required) is the auth identifier; `email` is optional + unique when set; role array; active flag |
| RefreshToken | `refresh_tokens` | JWT refresh tokens with revocation support |
| UserProfile | `user_profiles` | 1:1 profile with VIP, currency, financial summaries |
| GameProvider | `game_providers` | Game studios (Pragmatic Play, Evolution, etc.) |
| Game | `games` | Game catalogue with category, provider FK, sort order |
| GameLaunch | `game_launches` | User→Game launch tracking |
| Sport | `sports` | Sport types (Football, Basketball, etc.) |
| League | `leagues` | Leagues within a sport (EPL, NBA, etc.) |
| Team | `teams` | Teams that play in matches |
| SportMatch | `sport_matches` | Matches with odds, scores, status |
| Promotion | `promotions` | Promotional offers with status, VIP gate, date range |
| UserPromotion | `user_promotions` | Tracks which users claimed which promotions |
| Notification | `notifications` | Per-user notifications with read state |
| SupportTicket | `support_tickets` | Help desk tickets with priority and status |
| TicketMessage | `ticket_messages` | Messages within a support ticket thread |
| AuditLog | `audit_logs` | Audit trail with action, metadata JSON, IP, UA |
| ContactSubmission | `contact_submissions` | Public contact form entries (no auth required) |

## Enums (8 total)

| Enum | Values | Notes |
|------|--------|-------|
| UserRole | user, vip, moderator, admin, super_admin | Stored as PostgreSQL enum, matches API |
| TicketStatus | open, in_progress, waiting_on_user, resolved, closed | |
| TicketPriority | low, medium, high, urgent | |
| NotificationType | system, promotion, game, support, account, sport | |
| AuditAction | LOGIN, LOGOUT, REGISTER, PASSWORD_CHANGE, PROFILE_UPDATE, GAME_LAUNCH, PROMOTION_CLAIM, ADMIN_ACTION, SUPPORT_TICKET, SETTINGS_CHANGE | UPPERCASE to match existing API contract |
| GameCategory | slots, table, live_casino, esports, fishing, arcade | `live_casino` maps to `live-casino` in API |
| SportStatus | upcoming, live, finished, cancelled | |
| PromotionStatus | DRAFT, ACTIVE, PAUSED, EXPIRED | Internal only |

## Financial Fields

All financial fields use `Decimal(14, 2)` to avoid floating-point precision errors:
- `user_profiles.total_deposits`
- `user_profiles.total_withdrawals`
- `sport_matches.home_odds`, `draw_odds`, `away_odds` — `Decimal(6, 2)`

**Important:** No real-money transactions are implemented. These fields exist for the data model but store mock/placeholder values only.

## Indexes

Strategic indexes on:
- **Foreign keys**: All FK columns (userId, gameId, ticketId, etc.)
- **Status fields**: ticket status, promotion status, sport match status
- **Timestamps**: createdAt, startTime, launchedAt (for sorting/filtering)
- **Composite**: `(userId, isRead)` on notifications, `(userId, promotionId)` unique on user_promotions
- **Email**: On users (unique + index) and contact_submissions

## Cascade Rules

- **User deletion** cascades to: refresh tokens, profile, notifications, tickets, messages, audit logs, game launches, user promotions
- **Ticket deletion** cascades to: ticket messages
- **Game deletion** cascades to: game launches
- **Promotion deletion** cascades to: user promotions

## Migration Procedures

### Initial Setup

```bash
cd server

# 1. Copy environment template
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 2. Generate Prisma client
npm run prisma:generate

# 3. Create database and apply migrations
npm run prisma:migrate
# When prompted, name the migration (e.g., "init")

# 4. Seed development data
npm run prisma:seed
```

### Creating New Migrations

```bash
# After modifying prisma/schema.prisma:
npm run prisma:migrate
# Name your migration descriptively (e.g., "add_user_avatar")
```

### Production Deployment

```bash
# Apply pending migrations without interactive prompts
npm run prisma:migrate:prod
```

### Reset Database (Development Only)

```bash
# WARNING: Drops all data and re-creates from migrations + seed
npm run prisma:reset
```

### Prisma Studio (Visual DB Explorer)

```bash
npm run prisma:studio
# Opens browser at http://localhost:5555
```

## Seed Data

The seed script (`prisma/seed.ts`) creates:
- **4 users**: demo, admin, VIP, moderator (all password: `Test1234`)
- **5 game providers**: Pragmatic Play, Evolution, JILI, Playtech, Esports
- **14 games**: across slots, table, live-casino, esports categories
- **4 sports, 5 leagues, 12 teams, 7 matches**: with realistic scores and odds
- **6 promotions**: welcome bonus, cashback, free spins, etc.
- **5 notifications**: welcome and system messages
- **2 support tickets**: with message threads
- **7 audit log entries**: registration, login, admin actions
- **1 contact submission**: partnership inquiry

## Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/tcl11?schema=public` | PostgreSQL connection string |

The `DATABASE_URL` follows the format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

**Security notes:**
- Never commit `.env` files
- Use strong passwords in production
- Use SSL connections in production (`?sslmode=require`)
- Rotate credentials regularly
