# Auth httpOnly Cookie Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o armazenamento do JWT de `localStorage` para um cookie `httpOnly`, eliminando exposição do token a ataques XSS.

**Architecture:** Um Next.js Route Handler proxy (`/api/auth`) recebe as credenciais, chama o backend, e seta o cookie httpOnly com o payload `{accessToken, user}`. Um segundo handler (`/api/auth/session`) lê o cookie server-side e devolve o token ao Zustand store para reidratar a memória. O Axios client continua enviando `Authorization: Bearer` sem mudanças.

**Tech Stack:** Next.js 15 Route Handlers, `next/headers` cookies(), `NextResponse.cookies`, Zustand 5, Vitest, TypeScript strict

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/app/api/auth/route.ts` | Proxy login (POST) e logout (DELETE) — seta/limpa cookie |
| Criar | `src/app/api/auth/session/route.ts` | Lê cookie server-side e retorna `{accessToken, user}` |
| Criar | `src/middleware.ts` | Proteção server-side de rotas por presença do cookie |
| Modificar | `src/auth/auth.api.ts` | `loginRequest` chama `/api/auth` (proxy) via fetch |
| Modificar | `src/auth/auth.store.ts` | Remove localStorage; `restoreSession` vira async |
| Criar | `src/__tests__/api/auth.test.ts` | Testes do route handler login/logout |
| Criar | `src/__tests__/api/auth-session.test.ts` | Testes do route handler session |
| Criar | `src/__tests__/middleware.test.ts` | Testes do middleware |
| Criar | `vitest.config.ts` | Configuração do Vitest |

---

## Task 1: Configurar Vitest

**Files:**
- Criar: `vitest.config.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Instalar Vitest**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard
npm install -D vitest
```

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Adicionar script de test no `package.json`**

No bloco `"scripts"`, adicionar após `"typecheck"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verificar que vitest funciona**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run --reporter=verbose 2>&1 | head -20
```
Expected: `No test files found, exiting with code 0` ou similar (sem erros de config).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore(test): add vitest to uau-web-dashboard"
```

---

## Task 2: Auth Route Handler — Login e Logout (TDD)

**Files:**
- Criar: `src/__tests__/api/auth.test.ts`
- Criar: `src/app/api/auth/route.ts`

- [ ] **Step 1: Criar pasta de testes**

```bash
mkdir -p /mnt/hd/UAU-LAVACAR/uau-web-dashboard/src/__tests__/api
```

- [ ] **Step 2: Escrever os testes em `src/__tests__/api/auth.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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
```

- [ ] **Step 3: Rodar para confirmar que falham**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/api/auth.test.ts 2>&1
```
Expected: FAIL — `Cannot find module '@/app/api/auth/route'`

- [ ] **Step 4: Criar `src/app/api/auth/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'
const MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  const backendResponse = await fetch(`${backendUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const envelope = await backendResponse.json()

  if (!envelope.success) {
    return NextResponse.json(envelope, { status: backendResponse.status })
  }

  const { accessToken, user } = envelope.data

  const res = NextResponse.json({ success: true, data: { accessToken, user } })
  res.cookies.set(SESSION_COOKIE, JSON.stringify({ accessToken, user }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/api/auth.test.ts --reporter=verbose 2>&1
```
Expected: todos os 3 testes PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/route.ts src/__tests__/api/auth.test.ts
git commit -m "feat(auth): add Next.js proxy route for login/logout with httpOnly cookie"
```

---

## Task 3: Session Route Handler (TDD)

**Files:**
- Criar: `src/__tests__/api/auth-session.test.ts`
- Criar: `src/app/api/auth/session/route.ts`

- [ ] **Step 1: Escrever os testes em `src/__tests__/api/auth-session.test.ts`**

```ts
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
```

- [ ] **Step 2: Rodar para confirmar que falham**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/api/auth-session.test.ts 2>&1
```
Expected: FAIL — `Cannot find module '@/app/api/auth/session/route'`

- [ ] **Step 3: Criar `src/app/api/auth/session/route.ts`**

```ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE = '__uau_session'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: { message: 'No session' } },
      { status: 401 }
    )
  }

  try {
    const { accessToken, user } = JSON.parse(sessionCookie.value)
    return NextResponse.json({ success: true, data: { accessToken, user } })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid session' } },
      { status: 401 }
    )
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/api/auth-session.test.ts --reporter=verbose 2>&1
```
Expected: todos os 3 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/session/route.ts src/__tests__/api/auth-session.test.ts
git commit -m "feat(auth): add session route handler to restore auth from httpOnly cookie"
```

---

## Task 4: Middleware (TDD)

**Files:**
- Criar: `src/__tests__/middleware.test.ts`
- Criar: `src/middleware.ts`

- [ ] **Step 1: Escrever os testes em `src/__tests__/middleware.test.ts`**

```ts
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
```

- [ ] **Step 2: Rodar para confirmar que falham**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/middleware.test.ts 2>&1
```
Expected: FAIL — `Cannot find module '@/middleware'`

- [ ] **Step 3: Criar `src/middleware.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passam**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run src/__tests__/middleware.test.ts --reporter=verbose 2>&1
```
Expected: todos os testes PASS.

- [ ] **Step 5: Rodar todos os testes**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run --reporter=verbose 2>&1
```
Expected: todos os testes PASS.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/__tests__/middleware.test.ts
git commit -m "feat(auth): add middleware for server-side route protection by cookie presence"
```

---

## Task 5: Atualizar `auth.api.ts`

**Files:**
- Modify: `src/auth/auth.api.ts`

- [ ] **Step 1: Substituir o conteúdo de `src/auth/auth.api.ts`**

O arquivo atual usa Axios com base URL do backend. O novo chama o proxy Next.js via `fetch`.

Substituir o conteúdo completo por:

```ts
import { ApiEnvelope, LoginResponse } from '@/api/types'

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const envelope: ApiEnvelope<LoginResponse> = await response.json()

  if (!envelope.success) {
    throw new Error(envelope.error.message)
  }

  return envelope.data
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx tsc --noEmit 2>&1
```
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/auth/auth.api.ts
git commit -m "refactor(auth): loginRequest calls Next.js proxy instead of backend directly"
```

---

## Task 6: Atualizar `auth.store.ts` — remover localStorage

**Files:**
- Modify: `src/auth/auth.store.ts`

- [ ] **Step 1: Substituir o conteúdo de `src/auth/auth.store.ts`**

Substituir o arquivo completo por:

```ts
'use client'

import { create } from 'zustand'
import { ApiUser } from '@/api/types'
import { configureAuthSession } from '@/auth/auth-session'
import { loginRequest } from '@/auth/auth.api'

type AuthState = {
  accessToken: string | null
  user: ApiUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  logout: () => void
  restoreSession: () => Promise<void>
}

function roleHome(role?: string) {
  if (role === 'SUPER_ADMIN') return '/admin'
  if (role === 'FRANCHISE_OWNER') return '/franchise'
  if (role === 'PARTNER') return '/partner'
  if (role === 'OPERATOR') return '/operator'
  return '/login'
}

export const getRoleHome = roleHome

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  async login(email, password) {
    set({ isLoading: true })
    try {
      const result = await loginRequest(email, password)
      set({ accessToken: result.accessToken, user: result.user, isAuthenticated: true, isLoading: false })
      return result.user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout() {
    fetch('/api/auth', { method: 'DELETE' }).catch(() => {})
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false })
    window.location.href = '/login'
  },

  async restoreSession() {
    try {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        set({ isLoading: false })
        return
      }
      const envelope = await response.json()
      if (!envelope.success) {
        set({ isLoading: false })
        return
      }
      const { accessToken, user } = envelope.data
      set({ accessToken, user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().logout(),
})
```

- [ ] **Step 2: Confirmar que `localStorage` não existe mais em nenhum arquivo de auth**

```bash
grep -r "localStorage" /mnt/hd/UAU-LAVACAR/uau-web-dashboard/src/ --include="*.ts" --include="*.tsx"
```
Expected: nenhuma linha de output.

- [ ] **Step 3: Confirmar que `TOKEN_KEY` e `USER_KEY` sumiram**

```bash
grep -r "TOKEN_KEY\|USER_KEY\|uau\.web\." /mnt/hd/UAU-LAVACAR/uau-web-dashboard/src/ --include="*.ts" --include="*.tsx"
```
Expected: nenhuma linha de output.

- [ ] **Step 4: Typecheck completo**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx tsc --noEmit 2>&1
```
Expected: sem erros.

- [ ] **Step 5: Rodar todos os testes**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npx vitest run --reporter=verbose 2>&1
```
Expected: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/auth/auth.store.ts
git commit -m "feat(auth): remove localStorage, restore session from httpOnly cookie via /api/auth/session"
```

---

## Task 7: Verificação final

- [ ] **Step 1: Build de produção (typecheck + bundle)**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-web-dashboard && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` ou similar, sem erros de TypeScript.

- [ ] **Step 2: Confirmar que middleware foi detectado pelo Next.js**

No output do build, procurar por:
```
middleware
```
Expected: Next.js lista o middleware na saída do build.

- [ ] **Step 3: Varredura final de segurança**

```bash
grep -r "localStorage\|sessionStorage" /mnt/hd/UAU-LAVACAR/uau-web-dashboard/src/ --include="*.ts" --include="*.tsx"
```
Expected: nenhuma linha de output.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore(auth): final verification — no localStorage references remain"
```
