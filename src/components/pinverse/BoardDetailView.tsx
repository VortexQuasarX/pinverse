'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Globe, Bookmark, Trash2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { usePinStore, type PinData } from '@/stores/pin-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

interface BoardData {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPrivate: boolean
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  _count: { pins: number }
}

export function BoardDetailView() {
  const { selectedBoardId, goHome, selectPin, selectUser } = useViewStore()
  const { user } = useAuthStore()
  const [board, setBoard] = useState<BoardData | null>(null)
  const [pins, setPins] = useState<PinData[]>([])
  const [loading, setLoading] = useState(true)
  const [removingPin, setRemovingPin] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedBoardId) return
    let cancelled = false
    fetch(`/api/boards/${selectedBoardId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setBoard(data)
        const boardPins = (data.pins || []).map((bp: { pin: PinData }) => ({
          ...bp.pin,
          isLiked: false,
          isSaved: false,
          author: bp.pin.author || { id: '', name: 'Unknown', avatar: null },
          _count: bp.pin._count || { likes: 0, saves: 0, comments: 0 },
        }))
        setPins(boardPins)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedBoardId])

  const handleRemovePin = async (pinId: string) => {
    if (!selectedBoardId) return
    setRemovingPin(pinId)
    try {
      const res = await fetch(`/api/boards/${selectedBoardId}/pins`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId }),
      })
      if (res.ok) {
        toast({ title: 'Pin removed from board' })
        setPins((prev) => prev.filter((p) => p.id !== pinId))
      } else {
        toast({ title: 'Failed to remove pin', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to remove pin', variant: 'destructive' })
    }
    setRemovingPin(null)
  }

  if (loading) {
    return <BoardDetailSkeleton />
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    )
  }

  const isOwner = user?.id === board.user.id

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={goHome} className="mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Board Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{board.name}</h1>
                {board.isPrivate ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Globe className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              {board.description && (
                <p className="text-muted-foreground">{board.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <button
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => selectUser(board.user.id)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={board.user.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-red-100 text-red-600">
                      {board.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{board.user.name}</span>
                </button>
                <span className="text-sm text-muted-foreground">
                  {board._count.pins} pins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pins Grid */}
        {pins.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No pins yet</h3>
            <p className="text-muted-foreground text-sm">
              Save pins to this board from any pin card
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            {pins.map((pin, i) => (
              <div key={pin.id} className="group relative break-inside-avoid mb-4">
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer bg-muted"
                  onClick={() => selectPin(pin.id)}
                >
                  <Image
                    src={pin.imageUrl}
                    alt={pin.title}
                    width={400}
                    height={300}
                    className="w-full object-cover"
                    style={{ minHeight: '200px' }}
                    loading="lazy"
                    unoptimized={pin.imageUrl.startsWith('http') || pin.imageUrl.startsWith('data:')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>

                <div className="pt-2 px-1">
                  <h3 className="font-semibold text-sm line-clamp-2">{pin.title}</h3>
                </div>

                {/* Remove from board button (owner only) */}
                {isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemovePin(pin.id) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 dark:hover:bg-red-950"
                    disabled={removingPin === pin.id}
                  >
                    {removingPin === pin.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-500" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function BoardDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Skeleton className="h-6 w-16 mb-4" />
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-5 w-64 mb-4" />
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl mb-4" />
        ))}
      </div>
    </div>
  )
}
