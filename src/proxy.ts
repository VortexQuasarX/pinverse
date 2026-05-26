import { NextRequest, NextResponse } from 'next/server'

export default function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers - use SAMEORIGIN to allow preview iframes
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
