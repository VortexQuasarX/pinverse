import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

// GET /api/boards - List current user's boards
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boards = await db.board.findMany({
      where: { userId: session.id },
      include: {
        _count: {
          select: { pins: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ boards })
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST /api/boards - Create board
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = checkRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPrivate } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name for this user
    const existing = await db.board.findUnique({
      where: {
        userId_name: { userId: session.id, name: name.trim() },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A board with this name already exists' },
        { status: 409 }
      )
    }

    const board = await db.board.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPrivate: isPrivate ?? false,
        userId: session.id,
      },
      include: {
        _count: {
          select: { pins: true },
        },
      },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
