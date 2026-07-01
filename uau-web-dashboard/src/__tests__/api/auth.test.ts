import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

process.env.SESSION_SECRET = 'test-secret-for-unit-tests-only'

const mockFetch = vi.fn()
global.fetch = mockFetch

const BACKEND_USER = {
  id: 'u1',
  name: 'Admin',
  email: 'admin@uau.com',
  role: 'SUPER_ADMIN' as const,
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('POST /api/auth (login)', () => {
  it('retorna {user, accessToken} e seta cookie httpOnly no sucesso', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: { accessToken: 'jwt-abc-123', user: BACKEND_USER },
      }),
    })

    const { POST } = await import('@/app/api/auth/route')
    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@uau.com', password: 'secret' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBe('jwt-abc-123')
    expect(body.data.user.role).toBe('SUPER_ADMIN')

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('__uau_session=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Max-Age=604800')

    const cookieValue = setCookie.match(/__uau_session=([^;]+)/)?.[1] ?? ''
    expect(cookieValue.split('.')).toHaveLength(3)
    expect(() => JSON.parse(decodeURIComponent(cookieValue))).toThrow()
  })

  it('repassa erro do backend sem setar cookie', async () => {
    mockFetch.mockResolvedValue({
      status: 401,
      json: async () => ({
        success: false,
        error: { message: 'Credenciais inválidas' },
      }),
    })

    const { POST } = await import('@/app/api/auth/route')
    const req = new NextRequest('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@x.com', password: 'errado' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Credenciais inválidas')
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

describe('DELETE /api/auth (logout)', () => {
  it('deleta o cookie __uau_session', async () => {
    const { DELETE } = await import('@/app/api/auth/route')
    const res = await DELETE()
    const body = await res.json()

    expect(body.success).toBe(true)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('__uau_session=')
    expect(setCookie).toMatch(/Max-Age=0|expires=.*1970/i)
  })
})
