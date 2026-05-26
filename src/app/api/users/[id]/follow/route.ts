import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Cannot follow yourself
    if (session.id === id) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.id,
          followingId: id,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.id,
            followingId: id,
          },
        },
      })
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId: session.id,
          followingId: id,
        },
      })
    }

    // Get updated followers count
    const followersCount = await db.follow.count({
      where: { followingId: id },
    })

    return NextResponse.json({
      following: !existingFollow,
      followersCount,
    })
  } catch (error) {
    console.error('Error toggling follow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
