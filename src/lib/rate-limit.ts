import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const authRateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 60 seconds
const MAX_REQUESTS = 100
const AUTH_WINDOW_MS = 60 * 1000 // 60 seconds
const AUTH_MAX_REQUESTS = 10

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
  for (const [key, entry] of authRateLimitMap.entries()) {
    if (now > entry.resetTime) {
      authRateLimitMap.delete(key)
    }
  }
}, 60 * 1000)

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}

export function checkRateLimit(request: Request): NextResponse | null {
  const ip = getClientIp(request)
  const now = Date.now()

  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return null
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
        },
      }
    )
  }

  entry.count++
  return null
}

export function checkAuthRateLimit(request: Request): NextResponse | null {
  const ip = getClientIp(request)
  const now = Date.now()

  const entry = authRateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    authRateLimitMap.set(ip, {
      count: 1,
      resetTime: now + AUTH_WINDOW_MS,
    })
    return null
  }

  if (entry.count >= AUTH_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      { error: 'Too many authentication attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(AUTH_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
        },
      }
    )
  }

  entry.count++
  return null
}
