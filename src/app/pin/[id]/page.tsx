'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useViewStore } from '@/stores/view-store'

export default function PinPage() {
  const params = useParams()
  const router = useRouter()
  const { selectPin } = useViewStore()

  useEffect(() => {
    const id = params?.id
    if (id && typeof id === 'string') {
      selectPin(id)
      router.replace('/')
    }
  }, [params, selectPin, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
