# BetBoos365 API Endpoints

**Base URL:** `http://localhost:3200/api/v1`
**Auth:** Bearer token in `Authorization` header unless marked PUBLIC.

---

## Auth (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | PUBLIC | Register new user |
| POST | `/auth/login` | PUBLIC | Login, returns JWT tokens |
| POST | `/auth/refresh` | PUBLIC | Refresh access token |
| POST | `/auth/change-password` | JWT | Change current user password |
| POST | `/auth/logout` | JWT | Invalidate refresh token |

### Register Request
```json
{
  "username": "string (3-32, letters/digits/dot/underscore/hyphen; REQUIRED and unique)",
  "firstName": "string (2-50)",
  "lastName": "string (2-50)",
  "email": "valid email (OPTIONAL — may be omitted)",
  "password": "string (8-64, 1 upper, 1 lower, 1 digit)",
  "phone": "+8801234567890 (OPTIONAL)",
  "acceptTerms": true
}
```

### Login Request / Response
```json
// Request
{ "username": "demo", "password": "Pass1234" }

// Response
{
  "accessToken": "eyJhbG...",
  "refreshToken": "uuid-v4",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "demo",
    "email": "demo@betboos365.com | null",
    "firstName": "...",
    "lastName": "...",
    "roles": ["user"]
  }
}
```

---

## Users (`/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get current user |
| PATCH | `/users/me` | JWT | Update current user (name, phone) |
| GET | `/users` | ADMIN | List all users (paginated) |
| GET | `/users/:id` | ADMIN | Get user by ID |

---

## Profiles (`/profiles`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profiles/me` | JWT | Get current user profile |
| PATCH | `/profiles/me` | JWT | Update profile (display name, avatar, currency, language, timezone) |

---

## Games (`/games`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/games` | PUBLIC | List games (query: category, provider, search, page, limit) |
| GET | `/games/categories` | PUBLIC | List all game categories |
| GET | `/games/providers` | PUBLIC | List all game providers |
| GET | `/games/:id` | PUBLIC | Get game by ID |
| POST | `/games/:id/launch` | JWT | Record game launch |

---

## Sports (`/sports`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/sports` | PUBLIC | List events (query: sport, league, liveOnly, page, limit) |
| GET | `/sports/live` | PUBLIC | Get live events only |
| GET | `/sports/types` | PUBLIC | List available sports |
| GET | `/sports/:id` | PUBLIC | Get event by ID |

---

## Promotions (`/promotions`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/promotions` | PUBLIC | List active promotions |
| GET | `/promotions/:id` | PUBLIC | Get promotion by ID |
| POST | `/promotions` | ADMIN | Create new promotion |

---

## Notifications (`/notifications`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | JWT | List user notifications |
| GET | `/notifications/unread-count` | JWT | Get unread count |
| PATCH | `/notifications/:id/read` | JWT | Mark notification as read |
| PATCH | `/notifications/read-all` | JWT | Mark all as read |

### WebSocket Events (Socket.IO, `/ws`)

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client→Server | `authenticate` | `{userId}` | Bind socket to user |
| Client→Server | `subscribe:sports` | `{eventIds[]}` | Subscribe to live scores |
| Client→Server | `unsubscribe:sports` | `{eventIds[]}` | Unsubscribe from live scores |
| Server→Client | `notification` | `{id, type, title, message}` | Personal notification |
| Server→Client | `sport:update` | `{eventId, scores, odds}` | Live score update |

---

## Support (`/support`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/support/contact` | PUBLIC | Submit contact form |
| POST | `/support/tickets` | JWT | Create support ticket |
| GET | `/support/tickets/mine` | JWT | List my tickets |
| GET | `/support/tickets/:id` | JWT | Get ticket with messages |
| POST | `/support/tickets/:id/messages` | JWT | Add message to ticket |
| GET | `/support/tickets` | ADMIN/MOD | List all tickets (paginated) |
| PATCH | `/support/tickets/:id/status` | ADMIN/MOD | Update ticket status |

### Contact Form Request
```json
{
  "name": "string (2-100)",
  "email": "valid email",
  "subject": "string (5-200)",
  "message": "string (10-2000)"
}
```

---

## Admin (`/admin`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | ADMIN | Dashboard statistics |
| PATCH | `/admin/users/:id/roles` | ADMIN | Update user roles |
| PATCH | `/admin/users/:id/deactivate` | ADMIN | Deactivate user |
| GET | `/admin/audit-logs` | ADMIN | View audit logs |

### Dashboard Response
```json
{
  "totalUsers": 42,
  "activeUsers": 38,
  "totalGames": 14,
  "activePromotions": 6,
  "openTickets": 3,
  "connectedClients": 12,
  "recentRegistrations": 5
}
```

---

## Common Response Envelope

All successful responses are wrapped:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-11-10T..."
}
```

Error responses:
```json
{
  "success": false,
  "error": "UnauthorizedException",
  "message": "Invalid username or password",
  "statusCode": 401,
  "timestamp": "2026-11-10T..."
}
```

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```
