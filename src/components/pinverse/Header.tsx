'use client'

import { useState, useEffect, useRef } from 'react'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Home,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Heart,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const categories = [
  'All',
  'Architecture',
  'Art',
  'Food',
  'Nature',
  'Photography',
  'Travel',
  'Design',
  'Fashion',
  'Technology',
]

export function Header() {
  const { currentView, setView, setSearchQuery, setSelectedCategory, selectUser, goHome, searchQuery, selectedCategory } = useViewStore()
  const { user, logout, checkSession, hydrated } = useAuthStore()
  const [searchInput, setSearchInput] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hydrated) {
      checkSession()
    }
  }, [hydrated, checkSession])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim())
    }
  }

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat === 'All' ? '' : cat)
    if (currentView !== 'home' && currentView !== 'search') {
      setView('home')
    }
  }

  const handleLogout = async () => {
    await logout()
    goHome()
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1800px] mx-auto">
        {/* Main Header */}
        <div className="flex items-center gap-2 sm:gap-4 px-4 py-3">
          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold hidden sm:block bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              Pinverse
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={currentView === 'home' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={goHome}
              className="rounded-full"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
            {user && (
              <Button
                variant={currentView === 'create-pin' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('create-pin')}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            )}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search pins..."
                className="pl-10 pr-4 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-red-400"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {/* Notifications placeholder */}
                <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex" onClick={() => setView('create-pin')}>
                  <Plus className="w-5 h-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-red-100 text-red-600 text-sm font-semibold">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => selectUser(user.id)}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setView('create-pin')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Pin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('login')}
                  className="rounded-full"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('register')}
                  className="rounded-full bg-red-500 hover:bg-red-600"
                >
                  Sign up
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Category Bar */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (cat === 'All' && !selectedCategory) ||
                  cat === selectedCategory
                    ? 'bg-foreground text-background'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-2">
                <Button
                  variant={currentView === 'home' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => { goHome(); setMobileMenuOpen(false) }}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
                {user && (
                  <Button
                    variant={currentView === 'create-pin' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => { setView('create-pin'); setMobileMenuOpen(false) }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pin
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
