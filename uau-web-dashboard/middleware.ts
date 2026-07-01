import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from './src/lib/session'

const ROLE_HOMES: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  FRANCHISE_OWNER: '/franchise',
  PARTNER: '/partner',
  OPERATOR: '/operator',
}

const PROTECTED_ROUTES: Array<{ prefix: string; requiredRole: string }> = [
  { prefix: '/admin', requiredRole: 'SUPER_ADMIN' },
  { prefix: '/franchise', requiredRole: 'FRANCHISE_OWNER' },
  { prefix: '/partner', requiredRole: 'PARTNER' },
  { prefix: '/operator', requiredRole: 'OPERATOR' },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const route = PROTECTED_ROUTES.find(({ prefix }) => pathname.startsWith(prefix))
  if (!route) return NextResponse.next()

  const cookie = request.cookies.get(SESSION_COOKIE)

  if (!cookie?.value) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const session = await verifySession(cookie.value)

  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (session.user.role !== route.requiredRole) {
    const home = ROLE_HOMES[session.user.role] ?? '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/franchise/:path*', '/partner/:path*', '/operator/:path*'],
}
