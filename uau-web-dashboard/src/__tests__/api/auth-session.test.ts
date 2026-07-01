import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.SESSION_SECRET = 'test-secret-for-unit-tests-only'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { signSession } from '@/lib/session'

const SESSION_DATA = {
  accessToken: 'jwt-session-token',
  user: { id: 'u1', name: 'Admin', email: 'admin@uau.com', role: 'SUPER_ADMIN' },
}

beforeEach(() => {
  vi.resetModules()
  vi.mocked(cookies).mockReset()
})

describe('GET /api/auth/session', () => {
  it('retorna {accessToken, user} quando cookie assinado é válido', async () => {
    const signed = await signSession(SESSION_DATA)
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: signed }),
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

  it('retorna 401 quando o cookie foi editado manualmente (role alterado, assinatura inválida)', async () => {
    const signed = await signSession(SESSION_DATA)
    const [header, payload] = signed.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...SESSION_DATA, user: { ...SESSION_DATA.user, role: 'SUPER_ADMIN_FAKE' } })
    )
      .toString('base64url')
    const forged = `${header}.${tamperedPayload}.${signed.split('.')[2]}`

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: forged }),
    } as any)

    const { GET } = await import('@/app/api/auth/session/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(payload).not.toBe(tamperedPayload)
  })
})
