import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'

const PROTECTED_PREFIXES = ['/admin', '/franchise', '/partner', '/operator']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/franchise/:path*',
    '/partner/:path*',
    '/operator/:path*',
    '/login',
  ],
}
