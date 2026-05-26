# Task 7 - WebSocket Service Builder

## Task
Build a WebSocket mini-service using socket.io for real-time notifications in Pinverse.

## What Was Done

### Mini-Service Created
- Location: `/home/z/my-project/mini-services/realtime-service/`
- Independent bun project with own `package.json`
- Entry file: `index.ts`
- Port: **3003** (hardcoded, no PORT env)
- Dev command: `bun --hot index.ts`
- Dependency: `socket.io@4.8.3`

### Socket.io Events
- **connection** - Logs client connection
- **authenticate** - Receives `{ userId }`, joins room `user:${userId}`, emits `authenticated` back
- **disconnect** - Leaves user room, cleans up socketUserMap

### Server-Side Emitted Events
- **notification** - Sent to specific user's room via `io.to('user:${userId}').emit()`
- **pin-update** - Broadcast to all clients when pin-related notification (like/save/comment with pinId)
- **user-update** - Broadcast to all clients when follow notification

### HTTP Endpoints
- **POST /notify** - Body: `{ userId, type, message, fromUserId, pinId? }` - Sends notification to user
- **GET /health** - Returns status, connection count, authenticated user count

### Technical Decisions
- Used socket.io default path `/socket.io/` instead of `/` to avoid conflicts with custom HTTP routes
- When `path: '/'` was used, socket.io intercepted ALL HTTP requests (including /notify, /health), causing "Transport unknown" responses
- With `/socket.io/` path, socket.io only handles requests to `/socket.io/*`, leaving other routes free for our custom handlers
- Caddy gateway routes based on `XTransformPort` query parameter, not URL path, so this works transparently

### Frontend Connection
Frontend should connect with:
```ts
io({ path: '/socket.io/', query: { XTransformPort: '3003' } })
```

### Testing Results
All endpoints verified working:
- GET /health → `{"status":"ok","connections":0,"authenticatedUsers":0,"timestamp":"..."}`
- POST /notify with pinId → `{"success":true,"notificationId":"..."}` + logs pin-update broadcast
- POST /notify with follow → `{"success":true,"notificationId":"..."}` + logs user-update broadcast
- POST /notify missing fields → `{"error":"Missing required fields:..."}`
- GET /nonexistent → `{"error":"Not found"}`

## Files Created
- `/home/z/my-project/mini-services/realtime-service/package.json`
- `/home/z/my-project/mini-services/realtime-service/index.ts`
