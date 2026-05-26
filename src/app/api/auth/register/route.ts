import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken, setSessionCookie } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

interface RegisterBody {
  email: string
  name: string
  password: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json()
    const { email, name, password } = body

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'All fields are required (email, name, password)' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate name is non-empty
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
      },
    })

    // Create token and set session cookie
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    await setSessionCookie(token)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(
      { user: userWithoutPassword, message: 'Registration successful' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
