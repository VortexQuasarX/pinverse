import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/users/[id]/boards - Get user's public boards (or all if own profile)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const session = await getSession()
    const isOwnProfile = session?.id === userId

    const boards = await db.board.findMany({
      where: {
        userId,
        ...(isOwnProfile ? {} : { isPrivate: false }),
      },
      include: {
        _count: {
          select: { pins: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Error fetching user boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user boards' },
      { status: 500 }
    )
  }
}
