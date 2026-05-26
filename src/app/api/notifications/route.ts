import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/notifications - Get current user's notifications (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { toUserId: session.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where: { toUserId: session.id } }),
      db.notification.count({ where: { toUserId: session.id, read: false } }),
    ])

    // Enrich with fromUser data
    const fromUserIds = [...new Set(notifications.map((n) => n.fromUserId))]
    const fromUsers = await db.user.findMany({
      where: { id: { in: fromUserIds } },
      select: { id: true, name: true, avatar: true },
    })
    const fromUserMap = new Map(fromUsers.map((u) => [u.id, u]))

    const enriched = notifications.map((n) => ({
      ...n,
      fromUser: fromUserMap.get(n.fromUserId) || null,
    }))

    return NextResponse.json({
      notifications: enriched,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
