'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Pencil, X, Loader2, Camera, LayoutGrid } from 'lucide-react'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { usePinStore, type PinData } from '@/stores/pin-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PinCard } from './PinCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  createdAt: string
  _count: {
    pins: number
    followers: number
    following: number
  }
  isFollowing?: boolean
}

interface BoardData {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPrivate: boolean
  _count: { pins: number }
}

export function ProfileView() {
  const { selectedUserId, goHome, selectBoard } = useViewStore()
  const { user: currentUser, updateProfile } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userPins, setUserPins] = useState<PinData[]>([])
  const [savedPins, setSavedPins] = useState<PinData[]>([])
  const [userBoards, setUserBoards] = useState<BoardData[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Infinite scroll for pins
  const [pinsPage, setPinsPage] = useState(1)
  const [pinsHasMore, setPinsHasMore] = useState(true)
  const [pinsLoading, setPinsLoading] = useState(false)
  const pinsObserverRef = useRef<IntersectionObserver | null>(null)
  const pinsLoadMoreRef = useRef<HTMLDivElement | null>(null)

  const isOwnProfile = currentUser?.id === selectedUserId

  useEffect(() => {
    if (!selectedUserId) return

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/users/${selectedUserId}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setIsFollowing(data.isFollowing || false)
        }
      } catch {
        // silently fail
      }
      setLoading(false)
    }

    const fetchUserPins = async () => {
      setPinsLoading(true)
      try {
        const res = await fetch(`/api/users/${selectedUserId}/pins?page=1&limit=20`)
        if (res.ok) {
          const data = await res.json()
          const mapped = (data.pins || []).map((pin: Record<string, unknown>) => ({
            ...pin,
            isLiked: pin.liked ?? false,
            isSaved: pin.saved ?? false,
          }))
          setUserPins(mapped)
          setPinsPage(1)
          setPinsHasMore(mapped.length >= 20)
        }
      } catch {
        // silently fail
      }
      setPinsLoading(false)
    }

    const fetchSavedPins = async () => {
      if (!isOwnProfile) return
      try {
        const res = await fetch(`/api/users/${selectedUserId}/saved?limit=50`)
        if (res.ok) {
          const data = await res.json()
          const mapped = (data.pins || []).map((pin: Record<string, unknown>) => ({
            ...pin,
            isLiked: pin.liked ?? false,
            isSaved: pin.saved ?? false,
          }))
          setSavedPins(mapped)
        }
      } catch {
        // silently fail
      }
    }

    const fetchUserBoards = async () => {
      try {
        const res = await fetch(`/api/users/${selectedUserId}/boards`)
        if (res.ok) {
          const data = await res.json()
          setUserBoards(data.boards || [])
        }
      } catch {
        // silently fail
      }
    }

    fetchProfile()
    fetchUserPins()
    fetchSavedPins()
    fetchUserBoards()
  }, [selectedUserId, isOwnProfile])

  // Infinite scroll for user pins
  const handlePinsObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !pinsLoading && pinsHasMore) {
        const nextPage = pinsPage + 1
        setPinsLoading(true)
        fetch(`/api/users/${selectedUserId}/pins?page=${nextPage}&limit=20`)
          .then((res) => res.json())
          .then((data) => {
            const mapped = (data.pins || []).map((pin: Record<string, unknown>) => ({
              ...pin,
              isLiked: pin.liked ?? false,
              isSaved: pin.saved ?? false,
            }))
            setUserPins((prev) => [...prev, ...mapped])
            setPinsPage(nextPage)
            setPinsHasMore(mapped.length >= 20)
            setPinsLoading(false)
          })
          .catch(() => setPinsLoading(false))
      }
    },
    [pinsLoading, pinsHasMore, pinsPage, selectedUserId]
  )

  useEffect(() => {
    if (pinsObserverRef.current) pinsObserverRef.current.disconnect()
    pinsObserverRef.current = new IntersectionObserver(handlePinsObserver, { rootMargin: '200px' })
    if (pinsLoadMoreRef.current) pinsObserverRef.current.observe(pinsLoadMoreRef.current)
    return () => { if (pinsObserverRef.current) pinsObserverRef.current.disconnect() }
  }, [handlePinsObserver])

  const handleFollowToggle = async () => {
    if (!currentUser || !selectedUserId) return
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${selectedUserId}/follow`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.following)
        if (profile) {
          setProfile({
            ...profile,
            _count: {
              ...profile._count,
              followers: data.followersCount,
            },
          })
        }
      }
    } catch {
      // silently fail
    }
    setFollowLoading(false)
  }

  const startEditing = () => {
    if (!profile) return
    setEditName(profile.name)
    setEditBio(profile.bio || '')
    setEditAvatar(profile.avatar)
    setIsEditing(true)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setEditAvatar(data.url)
      } else {
        toast({ title: 'Failed to upload avatar', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to upload avatar', variant: 'destructive' })
    }
    setUploadingAvatar(false)
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast({ title: 'Name cannot be empty', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const updateData: Record<string, string> = { name: editName.trim() }
      if (editBio.trim()) updateData.bio = editBio.trim()
      if (editAvatar) updateData.avatar = editAvatar

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (res.ok) {
        const data = await res.json()
        await updateProfile(data.user)
        setProfile(prev => prev ? { ...prev, name: data.user.name, bio: data.user.bio, avatar: data.user.avatar } : null)
        setIsEditing(false)
        toast({ title: 'Profile updated!' })
      } else {
        toast({ title: 'Failed to update profile', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' })
    }
    setSaving(false)
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const displayAvatar = isEditing ? editAvatar : profile.avatar
  const displayName = isEditing ? editName : profile.name
  const displayBio = isEditing ? editBio : profile.bio

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={goHome} className="mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={displayAvatar || undefined} />
              <AvatarFallback className="text-2xl bg-red-100 text-red-600 font-bold">
                {displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute bottom-4 right-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity">
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </div>
              </label>
            )}
          </div>

          {isEditing ? (
            <div className="max-w-sm mx-auto space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg text-center"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-bio" className="text-xs">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="rounded-lg resize-none min-h-[80px]"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="flex gap-2 justify-center pt-2">
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
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-muted-foreground text-sm">{profile.email}</p>

              {profile.bio && (
                <p className="mt-2 text-sm max-w-md mx-auto">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <p className="font-bold text-lg">{profile._count.pins}</p>
                  <p className="text-xs text-muted-foreground">Pins</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{profile._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{profile._count.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              {/* Follow / Edit Button */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {!isOwnProfile && currentUser && (
                  <Button
                    onClick={handleFollowToggle}
                    className={`rounded-full font-semibold ${
                      isFollowing
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    disabled={followLoading}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
                {isOwnProfile && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={startEditing}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit Profile
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pins / Saved / Boards Tabs */}
        <Tabs defaultValue="pins" className="w-full">
          <TabsList className="w-full justify-center mb-6 bg-transparent">
            <TabsTrigger value="pins" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
              Pins
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                Saved
              </TabsTrigger>
            )}
            <TabsTrigger value="boards" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
              Boards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pins">
            {userPins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't created any pins yet" : "No pins yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                  {userPins.map((pin, i) => (
                    <PinCard key={pin.id} pin={pin} index={i} />
                  ))}
                </div>
                <div ref={pinsLoadMoreRef} className="flex justify-center py-4">
                  {pinsLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </div>
              </>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved">
              {savedPins.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No saved pins yet</p>
                </div>
              ) : (
                <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                  {savedPins.map((pin, i) => (
                    <PinCard key={pin.id} pin={pin} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="boards">
            {userBoards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't created any boards yet" : "No boards yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userBoards.map((board, i) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => selectBoard(board.id)}
                      className="w-full text-left"
                    >
                      <div className="aspect-square rounded-2xl bg-muted overflow-hidden relative group hover:shadow-lg transition-shadow">
                        {board.coverImage ? (
                          <img src={board.coverImage} alt={board.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <LayoutGrid className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                      <div className="pt-2 px-1">
                        <h3 className="font-semibold text-sm truncate">{board.name}</h3>
                        <p className="text-xs text-muted-foreground">{board._count.pins} pins</p>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-60 mx-auto" />
        <div className="flex items-center justify-center gap-6 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
