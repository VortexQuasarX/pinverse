import { create } from 'zustand'

export type ViewMode =
  | 'home'
  | 'login'
  | 'register'
  | 'pin-detail'
  | 'profile'
  | 'create-pin'
  | 'search'
  | 'boards'
  | 'board-detail'
  | 'notifications'

interface ViewState {
  currentView: ViewMode
  selectedPinId: string | null
  selectedUserId: string | null
  selectedBoardId: string | null
  searchQuery: string
  selectedCategory: string
}

interface ViewActions {
  setView: (view: ViewMode) => void
  selectPin: (pinId: string) => void
  selectUser: (userId: string) => void
  selectBoard: (boardId: string) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
  goHome: () => void
}

export const useViewStore = create<ViewState & ViewActions>((set) => ({
  currentView: 'home',
  selectedPinId: null,
  selectedUserId: null,
  selectedBoardId: null,
  searchQuery: '',
  selectedCategory: '',

  setView: (view) => set({ currentView: view }),
  selectPin: (pinId) => set({ currentView: 'pin-detail', selectedPinId: pinId }),
  selectUser: (userId) => set({ currentView: 'profile', selectedUserId: userId }),
  selectBoard: (boardId) => set({ currentView: 'board-detail', selectedBoardId: boardId }),
  setSearchQuery: (query) => set({ searchQuery: query, currentView: 'search' }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  goHome: () => set({ currentView: 'home', selectedPinId: null, selectedUserId: null, selectedBoardId: null, searchQuery: '', selectedCategory: '' }),
}))
