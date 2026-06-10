import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

function makeRequest(path: string, hasCookie = false) {
  const headers = new Headers()
  if (hasCookie) {
    headers.set('cookie', '__uau_session=some-value')
  }
  return new NextRequest(`http://localhost${path}`, { headers })
}

describe('middleware — rotas protegidas', () => {
  it.each(['/admin', '/admin/campaigns', '/franchise', '/franchise/customers', '/partner', '/operator'])(
    'redireciona %s para /login sem cookie',
    (path) => {
      const res = middleware(makeRequest(path, false))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost/login')
    }
  )

  it.each(['/admin', '/admin/campaigns', '/franchise', '/partner', '/operator'])(
    'permite %s com cookie',
    (path) => {
      const res = middleware(makeRequest(path, true))
      expect(res.status).toBe(200)
    }
  )
})

describe('middleware — /login', () => {
  it('redireciona /login para / quando já autenticado', () => {
    const res = middleware(makeRequest('/login', true))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('permite /login sem cookie', () => {
    const res = middleware(makeRequest('/login', false))
    expect(res.status).toBe(200)
  })
})
