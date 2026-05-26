import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE_NAME = 'pinverse-csrf'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Set CSRF cookie so the frontend can send it back on mutating requests
  const existingCsrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!existingCsrfCookie) {
    // Generate a random token using Edge-compatible crypto
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
