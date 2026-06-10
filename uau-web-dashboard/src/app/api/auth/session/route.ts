import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: { message: 'No session' } },
      { status: 401 }
    )
  }

  try {
    let parsed: { accessToken: string; user: unknown }
    try {
      parsed = JSON.parse(sessionCookie.value)
    } catch {
      parsed = JSON.parse(decodeURIComponent(sessionCookie.value))
    }
    const { accessToken, user } = parsed
    return NextResponse.json({ success: true, data: { accessToken, user } })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid session' } },
      { status: 401 }
    )
  }
}
