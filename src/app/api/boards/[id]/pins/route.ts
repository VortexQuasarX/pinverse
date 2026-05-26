import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

// POST /api/boards/[id]/pins - Add pin to board
export async function POST(
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

    const { id: boardId } = await params

    const board = await db.board.findUnique({ where: { id: boardId } })
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { pinId } = body

    if (!pinId || typeof pinId !== 'string') {
      return NextResponse.json(
        { error: 'Pin ID is required' },
        { status: 400 }
      )
    }

    // Verify pin exists
    const pin = await db.pin.findUnique({ where: { id: pinId } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Check if pin is already in the board
    const existing = await db.boardPin.findUnique({
      where: {
        boardId_pinId: { boardId, pinId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Pin is already in this board' },
        { status: 409 }
      )
    }

    const boardPin = await db.boardPin.create({
      data: { boardId, pinId },
    })

    return NextResponse.json(boardPin, { status: 201 })
  } catch (error) {
    console.error('Error adding pin to board:', error)
    return NextResponse.json(
      { error: 'Failed to add pin to board' },
      { status: 500 }
    )
  }
}

// DELETE /api/boards/[id]/pins - Remove pin from board
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

    const { id: boardId } = await params

    const board = await db.board.findUnique({ where: { id: boardId } })
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { pinId } = body

    if (!pinId || typeof pinId !== 'string') {
      return NextResponse.json(
        { error: 'Pin ID is required' },
        { status: 400 }
      )
    }

    const boardPin = await db.boardPin.findUnique({
      where: {
        boardId_pinId: { boardId, pinId },
      },
    })

    if (!boardPin) {
      return NextResponse.json(
        { error: 'Pin is not in this board' },
        { status: 404 }
      )
    }

    await db.boardPin.delete({
      where: { id: boardPin.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing pin from board:', error)
    return NextResponse.json(
      { error: 'Failed to remove pin from board' },
      { status: 500 }
    )
  }
}
