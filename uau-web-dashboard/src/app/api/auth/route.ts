import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'
const MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  let email: string, password: string
  try {
    ;({ email, password } = await request.json())
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    )
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  let backendResponse: Response
  try {
    backendResponse = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Serviço de autenticação indisponível' } },
      { status: 503 }
    )
  }

  const envelope = await backendResponse.json()

  if (!envelope.success) {
    return NextResponse.json(envelope, { status: backendResponse.status })
  }

  const { accessToken, user } = envelope.data

  const cookieValue = encodeURIComponent(JSON.stringify({ accessToken, user }))
  const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const cookieHeader = `${SESSION_COOKIE}=${cookieValue}; Path=/; Max-Age=${MAX_AGE}; HttpOnly${securePart}; SameSite=Lax`

  const res = NextResponse.json({ success: true, data: { accessToken, user } })
  res.headers.set('set-cookie', cookieHeader)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
