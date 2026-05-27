'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, MessageCircle, MoreHorizontal, Trash2, FolderPlus, Pencil, Share2, Search } from 'lucide-react'
import { usePinStore, type PinData } from '@/stores/pin-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface PinCardProps {
  pin: PinData
  index?: number
}

interface BoardOption {
  id: string
  name: string
  pinCount: number
}

export const PinCard = memo(function PinCard({ pin, index = 0 }: PinCardProps) {
  const { toggleLike, toggleSave, deletePin } = usePinStore()
  const { user } = useAuthStore()
  const { selectPin, selectUser, setView, setSearchQuery } = useViewStore()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [boards, setBoards] = useState<BoardOption[]>([])
  const [savingToBoard, setSavingToBoard] = useState<string | null>(null)

  const isOwner = user?.id === pin.authorId

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast({ title: 'Please log in to like pins', variant: 'destructive' })
      return
    }
    await toggleLike(pin.id)
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast({ title: 'Please log in to save pins', variant: 'destructive' })
      return
    }
    await toggleSave(pin.id)
    toast({
      title: pin.isSaved ? 'Pin unsaved' : 'Pin saved!',
      description: pin.isSaved ? 'Removed from your saved pins' : 'Added to your saved pins',
    })
  }

  const handleDelete = async () => {
    await deletePin(pin.id)
    toast({ title: 'Pin deleted' })
  }

  const handleSaveToBoard = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast({ title: 'Please log in first', variant: 'destructive' })
      return
    }
    setBoardDialogOpen(true)
    try {
      const res = await fetch('/api/boards')
      if (res.ok) {
        const data = await res.json()
        setBoards(data.boards || [])
      }
    } catch {
      // silently fail
    }
  }

  const savePinToBoard = async (boardId: string, boardName: string) => {
    setSavingToBoard(boardId)
    try {
      const res = await fetch(`/api/boards/${boardId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId: pin.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: `Saved to "${boardName}"` })
      } else {
        toast({ title: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to save to board', variant: 'destructive' })
    }
    setSavingToBoard(null)
    setBoardDialogOpen(false)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/pins/${pin.id}/share`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (navigator.share) {
          await navigator.share({
            title: pin.title,
            text: pin.description || `Check out "${pin.title}" on Pinverse!`,
            url: window.location.href,
          })
        } else {
          await navigator.clipboard.writeText(window.location.href)
          toast({ title: 'Link copied to clipboard!' })
        }
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Link copied!' })
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
        whileHover={{ scale: 1.02 }}
        className="group relative break-inside-avoid mb-4 transition-shadow duration-300 hover:shadow-lg rounded-2xl"
      >
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer bg-muted"
          onClick={() => selectPin(pin.id)}
        >
          {/* Image */}
          {!imageError ? (
            <Image
              src={pin.imageUrl}
              alt={pin.title}
              width={400}
              height={300}
              className={`w-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ minHeight: '200px' }}
              loading="lazy"
              unoptimized={pin.imageUrl.startsWith('http') || pin.imageUrl.startsWith('data:')}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">Image unavailable</span>
            </div>
          )}

          {/* Loading skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

          {/* Action buttons on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
              onClick={handleSave}
            >
              <Bookmark
                className={`w-4 h-4 ${pin.isSaved ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
              onClick={handleSaveToBoard}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setView('pin-detail'); selectPin(pin.id) }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Pin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/?text=${encodeURIComponent(`${pin.title} - ${window.location.href}`)}`, '_blank') }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </DropdownMenuItem>
                  {pin.category && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSearchQuery(pin.category!); setView('search') }}>
                      <Search className="w-4 h-4 mr-2" />
                      More like this
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Pin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isOwner && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                {pin.category && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={(e) => { e.stopPropagation(); setSearchQuery(pin.category!); setView('search') }}
                    title="More like this"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Like button bottom left */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full w-8 h-8 bg-white/90 hover:bg-white shadow-sm"
              onClick={handleLike}
            >
              <Heart
                className={`w-4 h-4 ${pin.isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* Pin Info */}
        <div className="pt-2 px-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {pin.title}
          </h3>
          {pin.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {pin.description}
            </p>
          )}
          {/* Author */}
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={pin.author.avatar || undefined} />
              <AvatarFallback className="text-[10px] bg-red-100 text-red-600">
                {pin.author.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer truncate"
              onClick={(e) => {
                e.stopPropagation()
                selectUser(pin.author.id)
              }}
            >
              {pin.author.name}
            </span>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {pin._count.likes > 0 && (
              <span className="flex items-center gap-0.5">
                <Heart className="w-3 h-3" /> {pin._count.likes}
              </span>
            )}
            {pin._count.comments > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" /> {pin._count.comments}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Save to Board Dialog */}
      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {boards.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No boards yet</p>
                <Button
                  size="sm"
                  className="rounded-full bg-red-500 hover:bg-red-600"
                  onClick={() => { setBoardDialogOpen(false); setView('boards') }}
                >
                  Create a Board
                </Button>
              </div>
            ) : (
              boards.map((board) => (
                <button
                  key={board.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => savePinToBoard(board.id, board.name)}
                  disabled={savingToBoard === board.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Bookmark className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{board.name}</p>
                      <p className="text-xs text-muted-foreground">{board.pinCount} pins</p>
                    </div>
                  </div>
                  {savingToBoard === board.id ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full">
                      Save
                    </Button>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
