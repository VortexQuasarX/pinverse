import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            pins: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if current user follows this user
    const session = await getSession()
    let isFollowing = false

    if (session && session.id !== id) {
      const followRecord = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.id,
            followingId: id,
          },
        },
      })
      isFollowing = !!followRecord
    }

    return NextResponse.json({
      ...user,
      isFollowing,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
