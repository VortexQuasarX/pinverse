'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, LayoutGrid, Lock, Globe, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

interface BoardData {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPrivate: boolean
  createdAt: string
  _count: { pins: number }
}

export function BoardsView() {
  const { user } = useAuthStore()
  const { selectBoard, setView } = useViewStore()
  const [boards, setBoards] = useState<BoardData[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editBoard, setEditBoard] = useState<BoardData | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrivate, setEditPrivate] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchBoards = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boards')
      if (res.ok) {
        const data = await res.json()
        setBoards(data.boards || [])
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/boards')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBoards(data.boards || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: 'Board name is required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          isPrivate: newPrivate,
        }),
      })
      if (res.ok) {
        toast({ title: 'Board created!' })
        setCreateOpen(false)
        setNewName('')
        setNewDesc('')
        setNewPrivate(false)
        fetchBoards()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed to create board', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to create board', variant: 'destructive' })
    }
    setCreating(false)
  }

  const handleEdit = (board: BoardData) => {
    setEditBoard(board)
    setEditName(board.name)
    setEditDesc(board.description || '')
    setEditPrivate(board.isPrivate)
  }

  const handleSaveEdit = async () => {
    if (!editBoard || !editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/boards/${editBoard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          isPrivate: editPrivate,
        }),
      })
      if (res.ok) {
        toast({ title: 'Board updated!' })
        setEditBoard(null)
        fetchBoards()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update board', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleDelete = async (boardId: string) => {
    if (!confirm('Delete this board? Pins will not be deleted.')) return
    try {
      const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Board deleted' })
        fetchBoards()
      } else {
        toast({ title: 'Failed to delete board', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete board', variant: 'destructive' })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view boards</p>
          <Button onClick={() => setView('login')} className="rounded-full bg-red-500 hover:bg-red-600">
            Log in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Boards</h1>
            <p className="text-muted-foreground mt-1">Organize your saved pins into collections</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-red-500 hover:bg-red-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create boards to organize your pins by topic, project, or mood
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-full bg-red-500 hover:bg-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards.map((board, i) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <button
                  onClick={() => selectBoard(board.id)}
                  className="w-full text-left"
                >
                  <div className="aspect-square rounded-2xl bg-muted overflow-hidden relative group-hover:shadow-lg transition-shadow">
                    {board.coverImage ? (
                      <img
                        src={board.coverImage}
                        alt={board.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {/* Privacy badge */}
                    <div className="absolute top-2 left-2">
                      {board.isPrivate ? (
                        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <Globe className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 px-1">
                    <h3 className="font-semibold text-sm truncate">{board.name}</h3>
                    <p className="text-xs text-muted-foreground">{board._count.pins} pins</p>
                  </div>
                </button>

                {/* Edit/Delete on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(board) }}
                    className="w-7 h-7 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center hover:bg-white dark:hover:bg-black/90 shadow-sm"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(board.id) }}
                    className="w-7 h-7 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 shadow-sm"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Board Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Board Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='e.g., "Travel Inspiration"'
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What's this board about?"
                className="rounded-lg resize-none min-h-[80px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Private Board</Label>
                <p className="text-xs text-muted-foreground">Only you can see this board</p>
              </div>
              <Switch checked={newPrivate} onCheckedChange={setNewPrivate} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-full bg-red-500 hover:bg-red-600"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Board Dialog */}
      <Dialog open={!!editBoard} onOpenChange={() => setEditBoard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Board Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="rounded-lg resize-none min-h-[80px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Private Board</Label>
                <p className="text-xs text-muted-foreground">Only you can see this board</p>
              </div>
              <Switch checked={editPrivate} onCheckedChange={setEditPrivate} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setEditBoard(null)}>
                Cancel
              </Button>
              <Button
                className="rounded-full bg-red-500 hover:bg-red-600"
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
