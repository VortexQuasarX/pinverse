'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, MessageCircle, Send, ArrowLeft, MoreHorizontal, Trash2, Link2, Pencil, X, Check, Share2, Twitter, Facebook } from 'lucide-react'
import { usePinStore, type PinComment } from '@/stores/pin-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { formatDistanceToNow } from 'date-fns'

const categories = [
  'Architecture', 'Art', 'Food', 'Nature', 'Photography',
  'Travel', 'Design', 'Fashion', 'Technology',
]

interface BoardOption {
  id: string
  name: string
  pinCount: number
}

export function PinDetailView() {
  const { currentPin, currentPinLoading, fetchPinById, toggleLike, toggleSave, addComment, deletePin } = usePinStore()
  const { user } = useAuthStore()
  const { selectedPinId, goHome, selectUser, setView } = useViewStore()
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const prevPinIdRef = useRef<string | null>(null)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [saving, setSaving] = useState(false)

  // Share dialog
  const [shareOpen, setShareOpen] = useState(false)

  // Board dialog
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [boards, setBoards] = useState<BoardOption[]>([])
  const [savingToBoard, setSavingToBoard] = useState<string | null>(null)

  // Deleting comment
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedPinId && selectedPinId !== prevPinIdRef.current) {
      prevPinIdRef.current = selectedPinId
      fetchPinById(selectedPinId)
    }
  }, [selectedPinId, fetchPinById])

  // Reset editing state when pin changes - derive from selectedPinId
  // Using key pattern instead of effect to reset editing

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

  const startEditing = () => {
    if (!currentPin) return
    setEditTitle(currentPin.title)
    setEditDescription(currentPin.description || '')
    setEditCategory(currentPin.category || '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/pins/${selectedPinId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Pin updated!' })
        await fetchPinById(selectedPinId!)
        setIsEditing(false)
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update pin', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Comment deleted' })
        await fetchPinById(selectedPinId!)
      } else {
        toast({ title: 'Failed to delete comment', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete comment', variant: 'destructive' })
    }
    setDeletingCommentId(null)
  }

  const handleSaveToBoard = async () => {
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
        body: JSON.stringify({ pinId: selectedPinId }),
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
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentPin.title)}&url=${encodeURIComponent(shareUrl)}`
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

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
            <Image
              src={currentPin.imageUrl}
              alt={currentPin.title}
              width={800}
              height={600}
              className="w-full h-auto max-h-[80vh] object-contain"
              unoptimized={currentPin.imageUrl.startsWith('http')}
              priority
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
                  onClick={handleSaveToBoard}
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="w-5 h-5" />
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
                    <DropdownMenuItem onClick={startEditing}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Pin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Pin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Edit Mode */}
            {isEditing ? (
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="rounded-lg min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(editCategory === cat ? '' : cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          editCategory === cat
                            ? 'bg-foreground text-background'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full bg-red-500 hover:bg-red-600"
                    onClick={handleSaveEdit}
                    disabled={saving || !editTitle.trim()}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

            {/* Author */}
            {!isEditing && (
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
            )}

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
                  <div key={comment.id} className="flex gap-2 group">
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
                        {/* Delete comment button for owner */}
                        {user?.id === comment.user.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                            disabled={deletingCommentId === comment.id}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                          </button>
                        )}
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

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Pin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                <Twitter className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Share on Twitter</p>
                <p className="text-xs text-muted-foreground">Post to your timeline</p>
              </div>
            </a>
            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Share on Facebook</p>
                <p className="text-xs text-muted-foreground">Share to your feed</p>
              </div>
            </a>
            <button
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors w-full"
              onClick={() => {
                handleCopyLink()
                setShareOpen(false)
              }}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Copy Link</p>
                <p className="text-xs text-muted-foreground">Copy link to clipboard</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
                    <Button size="sm" variant="outline" className="rounded-full">Save</Button>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
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
