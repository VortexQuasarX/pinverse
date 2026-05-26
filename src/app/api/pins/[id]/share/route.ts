import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/pins/[id]/share - Return share links for a pin
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pinId } = await params

    const pin = await db.pin.findUnique({ where: { id: pinId } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pinverse.app'
    const pinUrl = `${baseUrl}/pin/${pinId}`

    return NextResponse.json({
      links: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(pin.title)}&url=${encodeURIComponent(pinUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pinUrl)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(pinUrl)}&description=${encodeURIComponent(pin.title)}`,
        copyLink: pinUrl,
      },
      pinId,
    })
  } catch (error) {
    console.error('Error generating share links:', error)
    return NextResponse.json(
      { error: 'Failed to generate share links' },
      { status: 500 }
    )
  }
}
