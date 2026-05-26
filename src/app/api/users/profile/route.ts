import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, createToken, setSessionCookie } from '@/lib/auth'

export async function PUT(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, avatar } = body

    // Build update data with only provided fields
    const updateData: { name?: string; bio?: string | null; avatar?: string | null } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (bio !== undefined) {
      updateData.bio = bio
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    // Update user in database
    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create new JWT token with updated info and set cookie
    const token = await createToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    })
    await setSessionCookie(token)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
