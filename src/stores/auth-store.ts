import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar: string | null
  bio: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  hydrated: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        set({ loading: false })
        return { success: false, error: data.error || 'Login failed' }
      }
      set({ user: data.user, loading: false })
      return { success: true }
    } catch {
      set({ loading: false })
      return { success: false, error: 'Network error' }
    }
  },

  register: async (email, name, password) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        set({ loading: false })
        return { success: false, error: data.error || 'Registration failed' }
      }
      set({ user: data.user, loading: false })
      return { success: true }
    } catch {
      set({ loading: false })
      return { success: false, error: 'Network error' }
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ user: null })
    }
  },

  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      set({ user: data.user, hydrated: true })
    } catch {
      set({ user: null, hydrated: true })
    }
  },

  updateProfile: async (profileData) => {
    const user = get().user
    if (!user) return
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (res.ok) {
        set({ user: data.user })
      }
    } catch {
      // silently fail
    }
  },
}))
