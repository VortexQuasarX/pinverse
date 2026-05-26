'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { usePinStore } from '@/stores/pin-store'
import { Header } from '@/components/pinverse/Header'
import { MasonryGrid } from '@/components/pinverse/MasonryGrid'
import { LoginView, RegisterView } from '@/components/pinverse/AuthViews'
import { PinDetailView } from '@/components/pinverse/PinDetailView'
import { CreatePinView } from '@/components/pinverse/CreatePinView'
import { ProfileView } from '@/components/pinverse/ProfileView'
import { BoardsView } from '@/components/pinverse/BoardsView'
import { BoardDetailView } from '@/components/pinverse/BoardDetailView'

export default function Home() {
  const { currentView, selectedPinId } = useViewStore()
  const { checkSession, hydrated } = useAuthStore()
  const { fetchPins } = usePinStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (hydrated) {
      fetchPins()
    }
  }, [hydrated, fetchPins])

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginView />
      case 'register':
        return <RegisterView />
      case 'pin-detail':
        return <PinDetailView key={selectedPinId} />
      case 'create-pin':
        return <CreatePinView />
      case 'profile':
        return <ProfileView />
      case 'boards':
        return <BoardsView />
      case 'board-detail':
        return <BoardDetailView />
      case 'home':
      case 'search':
      default:
        return <MasonryGrid />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mt-auto border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Pinverse — Discover, save, and share creative ideas
        </p>
      </footer>
    </div>
  )
}
