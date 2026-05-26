import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.png'
    const filename = `${crypto.randomUUID()}${ext}`

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    // Save file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filePath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({
      url: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
