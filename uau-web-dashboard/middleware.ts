import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'

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

function parseSessionCookie(raw: string): { role: string } | null {
  try {
    const decoded = decodeURIComponent(raw)
    const parsed: { user?: { role?: string } } = JSON.parse(decoded)
    const role = parsed?.user?.role
    return role ? { role } : null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const route = PROTECTED_ROUTES.find(({ prefix }) => pathname.startsWith(prefix))
  if (!route) return NextResponse.next()

  const cookie = request.cookies.get(SESSION_COOKIE)

  if (!cookie?.value) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const session = parseSessionCookie(cookie.value)

  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (session.role !== route.requiredRole) {
    const home = ROLE_HOMES[session.role] ?? '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/franchise/:path*', '/partner/:path*', '/operator/:path*'],
}
