import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { signSession, type SessionUser } from '@/lib/session'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-unit-tests-only'
})

function makeUser(role: string): SessionUser {
  return { id: 'u1', name: 'Test', email: 'test@uau.com', role }
}

async function signedCookie(role: string): Promise<string> {
  return signSession({ accessToken: 'jwt-abc', user: makeUser(role) })
}

function makeRequest(path: string, cookieValue?: string) {
  const headers = new Headers()
  if (cookieValue) {
    headers.set('cookie', `__uau_session=${cookieValue}`)
  }
  return new NextRequest(`http://localhost${path}`, { headers })
}

describe('middleware — rotas protegidas', () => {
  it.each(['/admin', '/admin/campaigns', '/franchise', '/franchise/customers', '/partner', '/operator'])(
    'redireciona %s para /login sem cookie',
    async (path) => {
      const res = await middleware(makeRequest(path))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost/login')
    }
  )

  it.each(['/admin', '/admin/campaigns', '/franchise', '/franchise/customers', '/partner', '/operator'])(
    'redireciona %s para /login com cookie inválido/forjado',
    async (path) => {
      const res = await middleware(makeRequest(path, 'forged-or-tampered-value'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost/login')
    }
  )

  it.each([
    ['/admin', 'SUPER_ADMIN'],
    ['/admin/campaigns', 'SUPER_ADMIN'],
    ['/franchise', 'FRANCHISE_OWNER'],
    ['/partner', 'PARTNER'],
    ['/operator', 'OPERATOR'],
  ])('permite %s com cookie assinado de role %s', async (path, role) => {
    const cookie = await signedCookie(role)
    const res = await middleware(makeRequest(path, cookie))
    expect(res.status).toBe(200)
  })

  it('redireciona para a home do papel quando o role do cookie assinado não corresponde à rota', async () => {
    const cookie = await signedCookie('PARTNER')
    const res = await middleware(makeRequest('/admin', cookie))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/partner')
  })
})

describe('middleware — /login', () => {
  it('redireciona /login para / quando já autenticado com cookie assinado válido', async () => {
    const cookie = await signedCookie('SUPER_ADMIN')
    const res = await middleware(makeRequest('/login', cookie))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('permite /login sem cookie', async () => {
    const res = await middleware(makeRequest('/login'))
    expect(res.status).toBe(200)
  })

  it('permite /login com cookie forjado (não autenticado de fato)', async () => {
    const res = await middleware(makeRequest('/login', 'forged-or-tampered-value'))
    expect(res.status).toBe(200)
  })
})
