import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'

const SESSION_DATA = {
  accessToken: 'jwt-session-token',
  user: { id: 'u1', name: 'Admin', email: 'admin@uau.com', role: 'SUPER_ADMIN' },
}

beforeEach(() => {
  vi.resetModules()
  vi.mocked(cookies).mockReset()
})

describe('GET /api/auth/session', () => {
  it('retorna {accessToken, user} quando cookie existe', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: JSON.stringify(SESSION_DATA) }),
    } as any)

    const { GET } = await import('@/app/api/auth/session/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBe('jwt-session-token')
    expect(body.data.user.role).toBe('SUPER_ADMIN')
  })

  it('retorna 401 quando não há cookie', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any)

    const { GET } = await import('@/app/api/auth/session/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('retorna 401 quando cookie tem JSON inválido', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'não-é-json{{{' }),
    } as any)

    const { GET } = await import('@/app/api/auth/session/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })
})
