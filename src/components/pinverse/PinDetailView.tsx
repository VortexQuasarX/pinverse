'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart, Bookmark, MessageCircle, Send, ArrowLeft, MoreHorizontal, Trash2, Link2 } from 'lucide-react'
import { usePinStore, type PinComment } from '@/stores/pin-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

export function PinDetailView() {
  const { currentPin, currentPinLoading, fetchPinById, toggleLike, toggleSave, addComment, deletePin } = usePinStore()
  const { user } = useAuthStore()
  const { selectedPinId, goHome, selectUser, setView } = useViewStore()
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const prevPinIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (selectedPinId && selectedPinId !== prevPinIdRef.current) {
      prevPinIdRef.current = selectedPinId
      fetchPinById(selectedPinId)
    }
  }, [selectedPinId, fetchPinById])

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Please log in to like', variant: 'destructive' })
      return
    }
    await toggleLike(selectedPinId!)
  }

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Please log in to save', variant: 'destructive' })
      return
    }
    await toggleSave(selectedPinId!)
    toast({
      title: currentPin?.isSaved ? 'Pin unsaved' : 'Pin saved!',
    })
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    setSubmittingComment(true)
    await addComment(selectedPinId!, commentText.trim())
    setCommentText('')
    // Refresh pin to get updated comments
    await fetchPinById(selectedPinId!)
    setSubmittingComment(false)
  }

  const handleDelete = async () => {
    await deletePin(selectedPinId!)
    toast({ title: 'Pin deleted' })
    goHome()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({ title: 'Link copied!' })
  }

  if (currentPinLoading) {
    return <PinDetailSkeleton />
  }

  if (!currentPin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Pin not found</p>
      </div>
    )
  }

  const isOwner = user?.id === currentPin.authorId
  const comments = currentPin.comments || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={goHome} className="mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-lg overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative bg-muted">
            <img
              src={currentPin.imageUrl}
              alt={currentPin.title}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col max-h-[80vh]">
            {/* Action buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleLike}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      currentPin.isLiked ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleSave}
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      currentPin.isSaved ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={handleCopyLink}
                >
                  <Link2 className="w-5 h-5" />
                </Button>
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Pin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{currentPin.title}</h1>
            {currentPin.description && (
              <p className="text-muted-foreground mb-4">{currentPin.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" /> {currentPin._count.likes} likes
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="w-4 h-4" /> {currentPin._count.saves} saves
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" /> {currentPin._count.comments} comments
              </span>
            </div>

            {/* Category */}
            {currentPin.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium">
                  {currentPin.category}
                </span>
              </div>
            )}

            {/* Author */}
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => selectUser(currentPin.author.id)}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentPin.author.avatar || undefined} />
                <AvatarFallback className="bg-red-100 text-red-600 font-semibold">
                  {currentPin.author.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{currentPin.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(currentPin.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Comments */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mb-4">
              <h3 className="font-semibold text-sm">Comments</h3>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={comment.user.avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-red-100 text-red-600">
                        {comment.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{comment.user.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            {user ? (
              <form onSubmit={handleComment} className="flex gap-2 mt-auto pt-4 border-t">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-red-100 text-red-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="rounded-full flex-1"
                  disabled={submittingComment}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-red-500 hover:bg-red-600 shrink-0"
                  disabled={!commentText.trim() || submittingComment}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="mt-auto pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  <button
                    onClick={() => setView('login')}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Log in
                  </button>{' '}
                  to add a comment
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function PinDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-card rounded-3xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <Skeleton className="aspect-square" />
          <div className="p-8 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
