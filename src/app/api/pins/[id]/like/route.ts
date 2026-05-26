import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pushNotification } from '@/lib/notify'

export async function POST(
  _request: NextRequest,
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

    // Toggle: if already liked, unlike; otherwise, like
    const existingLike = await db.like.findUnique({
      where: { userId_pinId: { userId: session.id, pinId } },
    })

    let liked: boolean

    if (existingLike) {
      await db.like.delete({
        where: { userId_pinId: { userId: session.id, pinId } },
      })
      liked = false
    } else {
      await db.like.create({
        data: { userId: session.id, pinId },
      })
      liked = true

      // Create notification for pin author (if not self)
      if (pin.authorId !== session.id) {
        const liker = await db.user.findUnique({
          where: { id: session.id },
          select: { name: true },
        })
        const message = `${liker?.name || 'Someone'} liked your pin "${pin.title}"`
        await db.notification.create({
          data: {
            type: 'LIKE',
            message,
            fromUserId: session.id,
            toUserId: pin.authorId,
            pinId,
          },
        }).catch((err) => console.error('Error creating like notification:', err))

        // Push notification to realtime service (fire-and-forget)
        pushNotification({
          userId: pin.authorId,
          type: 'like',
          message,
          fromUserId: session.id,
          pinId,
        }).catch(() => {})
      }
    }

    const likesCount = await db.like.count({ where: { pinId } })

    return NextResponse.json({ liked, likesCount })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
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

    const { id: pinId } = await params

    const existingLike = await db.like.findUnique({
      where: { userId_pinId: { userId: session.id, pinId } },
    })

    if (existingLike) {
      await db.like.delete({
        where: { userId_pinId: { userId: session.id, pinId } },
      })
    }

    const likesCount = await db.like.count({ where: { pinId } })

    return NextResponse.json({ liked: false, likesCount })
  } catch (error) {
    console.error('Error unliking pin:', error)
    return NextResponse.json(
      { error: 'Failed to unlike pin' },
      { status: 500 }
    )
  }
}
