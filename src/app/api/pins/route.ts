import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined

    const conditions: Record<string, unknown>[] = []

    if (search) {
      const capitalized = search.charAt(0).toUpperCase() + search.slice(1)
      conditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { title: { contains: capitalized } },
          { description: { contains: capitalized } },
        ],
      })
    }

    if (category) {
      const capitalized = category.charAt(0).toUpperCase() + category.slice(1)
      conditions.push({
        OR: [
          { category: { equals: category } },
          { category: { equals: capitalized } },
        ],
      })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    const [pins, total] = await Promise.all([
      db.pin.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true, email: true },
          },
          _count: {
            select: { likes: true, saves: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pin.count({ where }),
    ])

    // Check current user's like/save status
    const session = await getSession()
    let userLikeStatus: Record<string, { liked: boolean; saved: boolean }> = {}

    if (session) {
      const pinIds = pins.map((pin) => pin.id)
      const [userLikes, userSaves] = await Promise.all([
        db.like.findMany({
          where: { userId: session.id, pinId: { in: pinIds } },
          select: { pinId: true },
        }),
        db.save.findMany({
          where: { userId: session.id, pinId: { in: pinIds } },
          select: { pinId: true },
        }),
      ])

      const likedPinIds = new Set(userLikes.map((l) => l.pinId))
      const savedPinIds = new Set(userSaves.map((s) => s.pinId))

      userLikeStatus = Object.fromEntries(
        pinIds.map((id) => [
          id,
          { liked: likedPinIds.has(id), saved: savedPinIds.has(id) },
        ])
      )
    }

    const pinsWithStatus = pins.map((pin) => ({
      ...pin,
      liked: session ? userLikeStatus[pin.id]?.liked ?? false : false,
      saved: session ? userLikeStatus[pin.id]?.saved ?? false : false,
    }))

    return NextResponse.json({
      pins: pinsWithStatus,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching pins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, imageUrl, category } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const pin = await db.pin.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        category: category?.trim() || null,
        authorId: session.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, email: true },
        },
      },
    })

    return NextResponse.json(pin, { status: 201 })
  } catch (error) {
    console.error('Error creating pin:', error)
    return NextResponse.json(
      { error: 'Failed to create pin' },
      { status: 500 }
    )
  }
}
