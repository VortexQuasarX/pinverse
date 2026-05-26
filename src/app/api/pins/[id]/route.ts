import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pin = await db.pin.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        _count: {
          select: { likes: true, saves: true, comments: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Check current user's like/save status
    const session = await getSession()
    let liked = false
    let saved = false

    if (session) {
      const [likeRecord, saveRecord] = await Promise.all([
        db.like.findUnique({
          where: { userId_pinId: { userId: session.id, pinId: id } },
        }),
        db.save.findUnique({
          where: { userId_pinId: { userId: session.id, pinId: id } },
        }),
      ])
      liked = !!likeRecord
      saved = !!saveRecord
    }

    return NextResponse.json({ ...pin, liked, saved })
  } catch (error) {
    console.error('Error fetching pin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pin' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = checkRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const pin = await db.pin.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    if (pin.authorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    if (category !== undefined) {
      updateData.category = category?.trim() || null
    }

    const updatedPin = await db.pin.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        _count: {
          select: { likes: true, saves: true, comments: true },
        },
      },
    })

    return NextResponse.json(updatedPin)
  } catch (error) {
    console.error('Error updating pin:', error)
    return NextResponse.json(
      { error: 'Failed to update pin' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const pin = await db.pin.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    if (pin.authorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.pin.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pin:', error)
    return NextResponse.json(
      { error: 'Failed to delete pin' },
      { status: 500 }
    )
  }
}
