import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const CSRF_COOKIE_NAME = 'pinverse-csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

function generateRandomToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function generateCsrfToken(): Promise<string> {
  const token = generateRandomToken()
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  })
  return token
}

export async function getCsrfToken(request: Request): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(CSRF_COOKIE_NAME)?.value
  return cookieValue ?? null
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Read token from header
  let headerToken: string | null = null
  if (request instanceof NextRequest) {
    headerToken = request.headers.get(CSRF_HEADER_NAME)
  } else {
    headerToken = request.headers.get(CSRF_HEADER_NAME)
  }

  if (!headerToken) return false

  // Read token from cookie
  const cookieToken = await getCsrfToken(request)
  if (!cookieToken) return false

  // Constant-time comparison
  if (headerToken.length !== cookieToken.length) return false

  let mismatch = 0
  for (let i = 0; i < headerToken.length; i++) {
    mismatch |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i)
  }

  return mismatch === 0
}
