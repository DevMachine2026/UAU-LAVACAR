import { SignJWT } from 'jose/jwt/sign'
import { jwtVerify } from 'jose/jwt/verify'

export const SESSION_COOKIE = '__uau_session'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

export interface SessionPayload {
  accessToken: string
  user: SessionUser
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ accessToken: payload.accessToken, user: payload.user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const accessToken = payload.accessToken
    const user = payload.user as SessionUser | undefined

    if (typeof accessToken !== 'string' || !user || typeof user.role !== 'string') {
      return null
    }

    return { accessToken, user }
  } catch {
    return null
  }
}
