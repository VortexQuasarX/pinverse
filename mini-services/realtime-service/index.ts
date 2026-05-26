import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthenticateData {
  userId: string
}

interface NotifyPayload {
  userId: string
  type: 'like' | 'save' | 'comment' | 'follow'
  message: string
  fromUserId: string
  pinId?: string
}

interface NotificationEvent {
  id: string
  type: NotifyPayload['type']
  message: string
  fromUserId: string
  pinId?: string
  timestamp: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 11)

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ─── Track user ↔ socket mapping ────────────────────────────────────────────

const socketUserMap = new Map<string, string>() // socketId -> userId

// ─── HTTP Server with request handler ────────────────────────────────────────

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // POST /notify — send a notification to a specific user
  if (req.method === 'POST' && req.url === '/notify') {
    try {
      const body = await readBody(req)
      const payload: NotifyPayload = JSON.parse(body)
      const { userId, type, message, fromUserId, pinId } = payload

      if (!userId || !type || !message || !fromUserId) {
        sendJson(res, 400, { error: 'Missing required fields: userId, type, message, fromUserId' })
        return
      }

      const notification: NotificationEvent = {
        id: generateId(),
        type,
        message,
        fromUserId,
        pinId,
        timestamp: new Date().toISOString(),
      }

      // Emit notification to the specific user's room
      io.to(`user:${userId}`).emit('notification', notification)
      console.log(`[Notify] Sent ${type} notification to user:${userId} from user:${fromUserId}${pinId ? ` pin:${pinId}` : ''}`)

      // If the notification is related to a pin, broadcast a pin-update event
      if (pinId) {
        io.emit('pin-update', {
          pinId,
          type,
          fromUserId,
          timestamp: notification.timestamp,
        })
        console.log(`[PinUpdate] Broadcast pin-update for pin:${pinId} (type: ${type})`)
      }

      // For follow events, broadcast a user-update event
      if (type === 'follow') {
        io.emit('user-update', {
          userId,
          fromUserId,
          timestamp: notification.timestamp,
        })
        console.log(`[UserUpdate] Broadcast user-update for user:${userId}`)
      }

      sendJson(res, 200, { success: true, notificationId: notification.id })
    } catch (error) {
      console.error('[Notify] Error:', error)
      sendJson(res, 400, { error: 'Invalid JSON body' })
    }
    return
  }

  // GET /health — health check
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      connections: io.sockets.sockets.size,
      authenticatedUsers: socketUserMap.size,
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Everything else — 404
  sendJson(res, 404, { error: 'Not found' })
})

// ─── Socket.io Server (uses default path /socket.io/ to avoid conflicts) ────

const io = new Server(httpServer, {
  // Using default path '/socket.io/' so custom HTTP routes (/notify, /health)
  // don't conflict with socket.io's transport handlers.
  // The Caddy gateway routes based on XTransformPort query parameter,
  // not URL path, so this works transparently.
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ─── Socket.io Event Handlers ────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`)

  // Authenticate: user joins their personal room for targeted notifications
  socket.on('authenticate', (data: AuthenticateData) => {
    const { userId } = data

    if (!userId) {
      console.warn(`[Auth] Missing userId from socket ${socket.id}`)
      return
    }

    // If this socket was previously authenticated for another user, clean up
    const previousUserId = socketUserMap.get(socket.id)
    if (previousUserId && previousUserId !== userId) {
      socket.leave(`user:${previousUserId}`)
      console.log(`[Auth] Socket ${socket.id} left room for user ${previousUserId}`)
    }

    // Join the user's personal room
    socket.join(`user:${userId}`)
    socketUserMap.set(socket.id, userId)

    console.log(`[Auth] Socket ${socket.id} authenticated as user ${userId}, joined room user:${userId}`)

    // Confirm authentication to the client
    socket.emit('authenticated', { userId, socketId: socket.id })
  })

  // Disconnect: clean up room membership
  socket.on('disconnect', (reason) => {
    const userId = socketUserMap.get(socket.id)

    if (userId) {
      socket.leave(`user:${userId}`)
      socketUserMap.delete(socket.id)
      console.log(`[Socket] Client ${socket.id} (user:${userId}) disconnected. Reason: ${reason}`)
    } else {
      console.log(`[Socket] Client ${socket.id} disconnected. Reason: ${reason}`)
    }
  })

  socket.on('error', (error: Error) => {
    console.error(`[Socket] Error on ${socket.id}:`, error.message)
  })
})

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`[Pinverse Realtime] Service running on port ${PORT}`)
  console.log(`[Pinverse Realtime] Socket.io path: /socket.io/ (default)`)
  console.log(`[Pinverse Realtime] POST /notify - Send notification to user`)
  console.log(`[Pinverse Realtime] GET /health  - Health check`)
})

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

const shutdown = () => {
  console.log('[Pinverse Realtime] Shutting down...')
  io.close()
  httpServer.close(() => {
    console.log('[Pinverse Realtime] Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
