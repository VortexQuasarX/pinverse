import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Check if user exists
    const userExists = await db.user.findUnique({ where: { id } })
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const [pins, total] = await Promise.all([
      db.pin.findMany({
        where: { authorId: id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              saves: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.pin.count({
        where: { authorId: id },
      }),
    ])

    return NextResponse.json({
      pins,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching user pins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
