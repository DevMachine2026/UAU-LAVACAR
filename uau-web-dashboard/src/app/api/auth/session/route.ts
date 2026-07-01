import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: { message: 'No session' } },
      { status: 401 }
    )
  }

  const session = await verifySession(sessionCookie.value)

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid session' } },
      { status: 401 }
    )
  }

  const { accessToken, user } = session
  return NextResponse.json({ success: true, data: { accessToken, user } })
}
