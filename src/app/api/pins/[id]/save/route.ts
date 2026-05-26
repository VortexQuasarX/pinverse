import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pinId } = await params

    // Check if pin exists
    const pin = await db.pin.findUnique({ where: { id: pinId } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Toggle: if already saved, unsave; otherwise, save
    const existingSave = await db.save.findUnique({
      where: { userId_pinId: { userId: session.id, pinId } },
    })

    let saved: boolean

    if (existingSave) {
      await db.save.delete({
        where: { userId_pinId: { userId: session.id, pinId } },
      })
      saved = false
    } else {
      await db.save.create({
        data: { userId: session.id, pinId },
      })
      saved = true
    }

    const savesCount = await db.save.count({ where: { pinId } })

    return NextResponse.json({ saved, savesCount })
  } catch (error) {
    console.error('Error toggling save:', error)
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pinId } = await params

    const existingSave = await db.save.findUnique({
      where: { userId_pinId: { userId: session.id, pinId } },
    })

    if (existingSave) {
      await db.save.delete({
        where: { userId_pinId: { userId: session.id, pinId } },
      })
    }

    const savesCount = await db.save.count({ where: { pinId } })

    return NextResponse.json({ saved: false, savesCount })
  } catch (error) {
    console.error('Error unsaving pin:', error)
    return NextResponse.json(
      { error: 'Failed to unsave pin' },
      { status: 500 }
    )
  }
}
