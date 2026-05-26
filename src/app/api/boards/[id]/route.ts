import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

// GET /api/boards/[id] - Get board with its pins
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const board = await db.board.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        pins: {
          include: {
            pin: {
              include: {
                author: {
                  select: { id: true, name: true, avatar: true },
                },
                _count: {
                  select: { likes: true, saves: true, comments: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { pins: true },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // If board is private, only the owner can see it
    if (board.isPrivate) {
      const session = await getSession()
      if (!session || session.id !== board.userId) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

// PUT /api/boards/[id] - Update board (only owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = checkRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const board = await db.board.findUnique({ where: { id } })
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, isPrivate, coverImage } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Board name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    if (isPrivate !== undefined) {
      updateData.isPrivate = Boolean(isPrivate)
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage
    }

    // Check for duplicate name if renaming
    if (updateData.name && updateData.name !== board.name) {
      const duplicate = await db.board.findUnique({
        where: {
          userId_name: { userId: session.id, name: updateData.name as string },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'A board with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedBoard = await db.board.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { pins: true },
        },
      },
    })

    return NextResponse.json(updatedBoard)
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}

// DELETE /api/boards/[id] - Delete board (only owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = checkRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const board = await db.board.findUnique({ where: { id } })
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.board.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}
