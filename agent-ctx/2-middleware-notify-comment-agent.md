# Task 2 - Middleware, Notification Push & Comment Edit Agent

## Summary
Completed all 3 tasks: middleware creation with rate limiting/CSRF/security headers, Socket.IO notification push wiring, and comment editing API route.

## Changes Made

### 1. Rate Limiting Enhancement (`/src/lib/rate-limit.ts`)
- Added `authRateLimitMap` (separate map for auth rate limits)
- Added `AUTH_WINDOW_MS` (60s) and `AUTH_MAX_REQUESTS` (10) constants
- Added cleanup for `authRateLimitMap` entries in the interval
- Created `checkAuthRateLimit()` function with 10 req/min window

### 2. Middleware (`/src/middleware.ts`) — NEW FILE
- Rate limiting: `checkRateLimit` for general API, `checkAuthRateLimit` for auth routes
- CSRF: generates 32-byte hex token cookie on initial requests; validates `x-csrf-token` header against cookie on POST/PUT/DELETE/PATCH; GET/HEAD/OPTIONS exempt
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Content-Security-Policy
- Matcher: `/api/:path*` only

### 3. Notification Push Helper (`/src/lib/notify.ts`) — NEW FILE
- `pushNotification(payload)` POSTs to `http://localhost:3003/notify`
- Server-to-server call (no gateway/XTransformPort needed)
- Catches errors silently

### 4. Wired Notification Push in 3 Routes
- `pins/[id]/like/route.ts` — pushes like notification after DB creation
- `pins/[id]/comments/route.ts` — pushes comment notification after DB creation  
- `users/[id]/follow/route.ts` — pushes follow notification after DB creation
- All use fire-and-forget pattern (`.catch(() => {})`)

### 5. Comment Edit API (`/src/app/api/comments/[id]/route.ts`)
- Added `PUT` handler: auth required, owner-only, validates content non-empty, rate limited
- Returns updated comment with user relation

### 6. Bug Fix
- Fixed pre-existing JSX parsing error in PinCard.tsx (missing `}` closing brace)

## Lint Status
✅ Passes clean with 0 errors
