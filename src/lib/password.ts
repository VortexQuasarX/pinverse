/**
 * Password hashing and verification utilities using Web Crypto API (SHA-256 with salt).
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hash === hashHex
}
