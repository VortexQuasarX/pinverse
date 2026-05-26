'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { usePinStore } from '@/stores/pin-store'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

const categories = [
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

export function CreatePinView() {
  const { createPin, uploadImage } = usePinStore()
  const { user } = useAuthStore()
  const { goHome, setView } = useViewStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Image must be less than 10MB', variant: 'destructive' })
      return
    }

    setUploading(true)
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    const result = await uploadImage(file)
    if (result) {
      setImageUrl(result.url)
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' })
      setImagePreview('')
    }
    setUploading(false)
  }, [uploadImage])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleImageUpload(file)
    },
    [handleImageUpload]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !imageUrl) {
      toast({ title: 'Please add a title and image', variant: 'destructive' })
      return
    }

    setCreating(true)
    const result = await createPin({
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl,
      category: category || undefined,
    })
    setCreating(false)

    if (result.success) {
      toast({ title: 'Pin created!' })
      goHome()
    } else {
      toast({ title: result.error || 'Failed to create pin', variant: 'destructive' })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to create a pin</p>
          <Button onClick={() => setView('login')} className="rounded-full bg-red-500 hover:bg-red-600">
            Log in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Create Pin</h1>
        <p className="text-muted-foreground mb-8">Share your ideas with the world</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-red-400 bg-red-50 dark:bg-red-950'
                : imagePreview
                ? 'border-transparent'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-80 rounded-2xl mx-auto object-contain"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={() => { setImagePreview(''); setImageUrl('') }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
                <label className="mt-4 inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLElement
                      input?.click()
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse files
                      </>
                    )}
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="pin-title">Title *</Label>
            <Input
              id="pin-title"
              placeholder="Give your pin a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="pin-desc">Description</Label>
            <Textarea
              id="pin-desc"
              placeholder="Tell everyone what your pin is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg min-h-[100px] resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-foreground text-background'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold h-11"
            disabled={creating || !imageUrl || !title.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Pin'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
