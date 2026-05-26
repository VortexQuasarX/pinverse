'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePinStore } from '@/stores/pin-store'
import { useViewStore } from '@/stores/view-store'
import { PinCard } from './PinCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MasonryGrid() {
  const { pins, loading, loadingMore, fetchPins, fetchMorePins, totalPages, page } = usePinStore()
  const { searchQuery, selectedCategory, setView, goHome } = useViewStore()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Fetch pins when search/category changes
  useEffect(() => {
    fetchPins(searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory, fetchPins])

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !loadingMore && page < totalPages) {
        fetchMorePins()
      }
    },
    [loadingMore, page, totalPages, fetchMorePins]
  )

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleObserver])

  if (loading) {
    return <MasonrySkeleton />
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"
        >
          <SearchX className="w-12 h-12 text-muted-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold mb-2">No pins found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search or explore categories.`
              : 'Be the first to share something inspiring!'}
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={searchQuery ? goHome : () => setView('create-pin')}
          >
            {searchQuery ? 'Clear search' : 'Create a Pin'}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4">
      {/* Masonry grid using CSS columns */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
        {pins.map((pin, index) => (
          <motion.div
            key={pin.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.4,
              delay: Math.min(index % 6 * 0.08, 0.4),
              ease: 'easeOut',
            }}
          >
            <PinCard pin={pin} index={index} />
          </motion.div>
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="flex flex-col items-center justify-center py-8 gap-2">
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            <span className="text-xs text-muted-foreground">Loading more pins...</span>
          </motion.div>
        )}
        {!loadingMore && page >= totalPages && pins.length > 0 && (
          <p className="text-xs text-muted-foreground">You&apos;ve seen all the pins!</p>
        )}
      </div>
    </div>
  )
}

function MasonrySkeleton() {
  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4">
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="mb-4 break-inside-avoid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <Skeleton
              className="w-full rounded-2xl"
              style={{ height: `${200 + ((i * 37) % 200)}px` }}
            />
            <div className="pt-2 px-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
