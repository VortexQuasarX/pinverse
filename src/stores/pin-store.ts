import { create } from 'zustand'

export interface PinAuthor {
  id: string
  name: string
  avatar: string | null
}

export interface PinComment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface PinData {
  id: string
  title: string
  description: string | null
  imageUrl: string
  category: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  author: PinAuthor
  _count: {
    likes: number
    saves: number
    comments: number
  }
  isLiked?: boolean
  isSaved?: boolean
  comments?: PinComment[]
}

interface PinState {
  pins: PinData[]
  loading: boolean
  loadingMore: boolean
  page: number
  totalPages: number
  total: number
  currentPin: PinData | null
  currentPinLoading: boolean
}

interface PinActions {
  fetchPins: (search?: string, category?: string, reset?: boolean) => Promise<void>
  fetchMorePins: () => Promise<void>
  fetchPinById: (id: string) => Promise<void>
  createPin: (data: { title: string; description?: string; imageUrl: string; category?: string }) => Promise<{ success: boolean; error?: string }>
  deletePin: (id: string) => Promise<void>
  toggleLike: (pinId: string) => Promise<void>
  toggleSave: (pinId: string) => Promise<void>
  addComment: (pinId: string, content: string) => Promise<void>
  setCurrentPin: (pin: PinData | null) => void
  uploadImage: (file: File) => Promise<{ url: string } | null>
  resetPins: () => void
}

export const usePinStore = create<PinState & PinActions>((set, get) => ({
  pins: [],
  loading: false,
  loadingMore: false,
  page: 1,
  totalPages: 1,
  total: 0,
  currentPin: null,
  currentPinLoading: false,

  fetchPins: async (search, category, reset = true) => {
    set(reset ? { loading: true, pins: [] } : { loading: true })
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (category) params.set('category', category)

      const res = await fetch(`/api/pins?${params}`)
      const data = await res.json()
      const mappedPins = (data.pins || []).map((pin: Record<string, unknown>) => ({
        ...pin,
        isLiked: pin.liked ?? false,
        isSaved: pin.saved ?? false,
      }))
      set({
        pins: mappedPins,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  fetchMorePins: async () => {
    const { page, totalPages, pins } = get()
    if (page >= totalPages) return
    set({ loadingMore: true })
    try {
      const params = new URLSearchParams()
      params.set('page', String(page + 1))
      params.set('limit', '20')

      const res = await fetch(`/api/pins?${params}`)
      const data = await res.json()
      set({
        pins: [...pins, ...(data.pins || [])],
        page: data.page || page + 1,
        totalPages: data.totalPages || totalPages,
        total: data.total || 0,
        loadingMore: false,
      })
    } catch {
      set({ loadingMore: false })
    }
  },

  fetchPinById: async (id) => {
    set({ currentPinLoading: true, currentPin: null })
    try {
      const res = await fetch(`/api/pins/${id}`)
      if (res.ok) {
        const data = await res.json()
        const mappedPin = {
          ...data,
          isLiked: data.liked ?? false,
          isSaved: data.saved ?? false,
        }
        set({ currentPin: mappedPin, currentPinLoading: false })
      } else {
        set({ currentPinLoading: false })
      }
    } catch {
      set({ currentPinLoading: false })
    }
  },

  createPin: async (pinData) => {
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create pin' }
      }
      // Add to beginning of pins list
      set((state) => ({ pins: [data, ...state.pins] }))
      return { success: true }
    } catch {
      return { success: false, error: 'Network error' }
    }
  },

  deletePin: async (id) => {
    try {
      await fetch(`/api/pins/${id}`, { method: 'DELETE' })
      set((state) => ({
        pins: state.pins.filter((p) => p.id !== id),
        currentPin: state.currentPin?.id === id ? null : state.currentPin,
      }))
    } catch {
      // silently fail
    }
  },

  toggleLike: async (pinId) => {
    try {
      const res = await fetch(`/api/pins/${pinId}/like`, { method: 'POST' })
      const data = await res.json()
      
      const updatePin = (pin: PinData) => {
        if (pin.id === pinId) {
          return {
            ...pin,
            isLiked: data.liked,
            _count: {
              ...pin._count,
              likes: data.likesCount,
            },
          }
        }
        return pin
      }

      set((state) => ({
        pins: state.pins.map(updatePin),
        currentPin: state.currentPin ? updatePin(state.currentPin) : null,
      }))
    } catch {
      // silently fail
    }
  },

  toggleSave: async (pinId) => {
    try {
      const res = await fetch(`/api/pins/${pinId}/save`, { method: 'POST' })
      const data = await res.json()
      
      const updatePin = (pin: PinData) => {
        if (pin.id === pinId) {
          return {
            ...pin,
            isSaved: data.saved,
            _count: {
              ...pin._count,
              saves: data.savesCount,
            },
          }
        }
        return pin
      }

      set((state) => ({
        pins: state.pins.map(updatePin),
        currentPin: state.currentPin ? updatePin(state.currentPin) : null,
      }))
    } catch {
      // silently fail
    }
  },

  addComment: async (pinId, content) => {
    try {
      const res = await fetch(`/api/pins/${pinId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const newComment = await res.json()
      
      set((state) => {
        if (!state.currentPin || state.currentPin.id !== pinId) return state
        return {
          currentPin: {
            ...state.currentPin,
            comments: [newComment, ...(state.currentPin.comments || [])],
            _count: {
              ...state.currentPin._count,
              comments: state.currentPin._count.comments + 1,
            },
          },
        }
      })
    } catch {
      // silently fail
    }
  },

  setCurrentPin: (pin) => set({ currentPin: pin }),

  uploadImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        return { url: data.url }
      }
      return null
    } catch {
      return null
    }
  },

  resetPins: () => set({ pins: [], page: 1, totalPages: 1, total: 0, loading: false }),
}))
