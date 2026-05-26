import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

export interface NotificationData {
  id: string
  type: string
  message: string
  fromUserId: string
  toUserId: string
  pinId: string | null
  read: boolean
  createdAt: string
  fromUser?: {
    id: string
    name: string
    avatar: string | null
  }
}

interface NotificationState {
  notifications: NotificationData[]
  unreadCount: number
  loading: boolean
  socket: Socket | null
  connected: boolean
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>
  markAllRead: () => Promise<void>
  markOneRead: (id: string) => Promise<void>
  connectSocket: (userId: string) => void
  disconnectSocket: () => void
  addNotification: (notification: NotificationData) => void
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  socket: null,
  connected: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        set({
          notifications: data.notifications || [],
          unreadCount: data.unreadCount || 0,
          loading: false,
        })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  markAllRead: async () => {
    try {
      await fetch('/api/notifications/read', { method: 'PUT' })
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch {
      // silently fail
    }
  },

  markOneRead: async (id) => {
    try {
      await fetch(`/api/notifications/read/${id}`, { method: 'PUT' })
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {
      // silently fail
    }
  },

  connectSocket: (userId) => {
    const existing = get().socket
    if (existing) return

    const socket = io({
      path: '/socket.io/',
      query: { XTransformPort: '3003' },
    })

    socket.on('connect', () => {
      socket.emit('authenticate', { userId })
      set({ connected: true })
    })

    socket.on('notification', (data: NotificationData) => {
      get().addNotification(data)
    })

    socket.on('disconnect', () => {
      set({ connected: false })
    })

    set({ socket })
  },

  disconnectSocket: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, connected: false })
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },
}))
