import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken, setSessionCookie } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'

interface LoginBody {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

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
      { user: userWithoutPassword, message: 'Login successful' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
