'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Bookmark, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import { usePinStore, type PinData } from '@/stores/pin-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'

interface PinCardProps {
  pin: PinData
  index?: number
}

export const PinCard = memo(function PinCard({ pin, index = 0 }: PinCardProps) {
  const { toggleLike, toggleSave, deletePin } = usePinStore()
  const { user } = useAuthStore()
  const { selectPin, selectUser } = useViewStore()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative break-inside-avoid mb-4"
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
            }`
            }
            style={{ minHeight: '200px' }}
            loading="lazy"
            unoptimized={pin.imageUrl.startsWith('http')}
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
  )
})
