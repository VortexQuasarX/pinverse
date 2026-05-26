import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pinId } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    // Check if pin exists
    const pin = await db.pin.findUnique({ where: { id: pinId } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { pinId },
        include: {
          user: {
            select: { id: true, name: true, avatar: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.comment.count({ where: { pinId } }),
    ])

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pinId } = await params

    // Check if pin exists
    const pin = await db.pin.findUnique({ where: { id: pinId } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        userId: session.id,
        pinId,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, email: true },
        },
      },
    })

    // Create notification for pin author (if not self)
    if (pin.authorId !== session.id) {
      const commenter = await db.user.findUnique({
        where: { id: session.id },
        select: { name: true },
      })
      await db.notification.create({
        data: {
          type: 'COMMENT',
          message: `${commenter?.name || 'Someone'} commented on your pin "${pin.title}"`,
          fromUserId: session.id,
          toUserId: pin.authorId,
          pinId,
        },
      }).catch((err) => console.error('Error creating comment notification:', err))
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
