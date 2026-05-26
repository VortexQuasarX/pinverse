'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePinStore } from '@/stores/pin-store'
import { useViewStore } from '@/stores/view-store'
import { PinCard } from './PinCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export function MasonryGrid() {
  const { pins, loading, loadingMore, fetchPins, fetchMorePins, totalPages, page } = usePinStore()
  const { searchQuery, selectedCategory } = useViewStore()
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
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-muted-foreground" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1">No pins found</h3>
        <p className="text-muted-foreground text-sm">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : 'Be the first to share something inspiring!'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto px-2 sm:px-4">
      {/* Masonry grid using CSS columns */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
        {pins.map((pin, index) => (
          <PinCard key={pin.id} pin={pin} index={index} />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loadingMore && (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
          <div key={i} className="mb-4 break-inside-avoid">
            <Skeleton
              className="w-full rounded-2xl"
              style={{ height: `${200 + Math.random() * 200}px` }}
            />
            <div className="pt-2 px-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
