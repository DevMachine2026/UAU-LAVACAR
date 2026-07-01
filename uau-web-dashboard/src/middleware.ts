import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

const ROLE_HOMES: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  FRANCHISE_OWNER: '/franchise',
  PARTNER: '/partner',
  OPERATOR: '/operator',
}

const PROTECTED_ROUTES: Array<{ prefix: string; allowedRoles: string[] }> = [
  { prefix: '/admin', allowedRoles: ['SUPER_ADMIN'] },
  { prefix: '/franchise', allowedRoles: ['FRANCHISE_OWNER', 'SUPER_ADMIN'] },
  { prefix: '/partner', allowedRoles: ['PARTNER', 'SUPER_ADMIN'] },
  { prefix: '/operator', allowedRoles: ['OPERATOR'] },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookie = request.cookies.get(SESSION_COOKIE)
  const session = cookie?.value ? await verifySession(cookie.value) : null

  const route = PROTECTED_ROUTES.find(({ prefix }) => pathname.startsWith(prefix))

  if (route) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!route.allowedRoles.includes(session.user.role)) {
      const home = ROLE_HOMES[session.user.role] ?? '/login'
      return NextResponse.redirect(new URL(home, request.url))
    }
    return NextResponse.next()
  }

  if (pathname === '/login' && session) {
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
