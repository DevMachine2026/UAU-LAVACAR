# Auth: Migração de localStorage para httpOnly Cookie

**Projeto:** uau-web-dashboard (Next.js 15)
**Data:** 2026-06-10
**Status:** Aprovado

## Problema

O token JWT é armazenado em `localStorage` (`uau.web.accessToken` e `uau.web.user`), acessível por qualquer script JavaScript na página. Isso expõe o token a ataques XSS.

## Objetivo

Armazenar o token em um cookie `httpOnly`, inacessível ao JavaScript, sem alterar o backend NestJS nem a arquitetura Axios existente.

## Abordagem escolhida

**Token em memória (Zustand) + cookie httpOnly para persistência.**

- O cookie httpOnly é lido server-side via Next.js Route Handler para repopular o Zustand na restauração de sessão.
- O Axios continua enviando `Authorization: Bearer` a partir do token em memória — zero mudanças no backend.

Descartado: abordagem `credentials: 'include'` direta ao backend (exigiria mudanças no NestJS).

## Arquitetura

```
[Login form]
    │ POST {email, password}
    ▼
POST /api/auth          ← Next.js proxy (NOVO)
    │ Chama backend /auth/login
    │ Seta cookie __uau_session (httpOnly)
    │ Retorna {user, accessToken} ao store
    ▼
[auth.store.ts]          ← MODIFICADO
    │ Guarda accessToken + user em memória Zustand (não mais localStorage)
    ▼
[api/client.ts]          ← SEM MUDANÇA
    │ Lê token via getAuthAccessToken() → Authorization: Bearer
    ▼
[Backend API (NEXT_PUBLIC_API_URL)]
```

### Restauração de sessão (page reload)

```
[page.tsx / ProtectedRoute.tsx]
    │ restoreSession() — agora async
    ▼
GET /api/auth/session    ← Next.js Route Handler (NOVO)
    │ Lê cookie __uau_session via cookies() server-side
    │ Retorna {accessToken, user}
    ▼
[auth.store.ts]          → reidrata memória, isLoading: false
```

### Logout

```
[auth.store.ts] logout()
    │ DELETE /api/auth/logout  ← limpa cookie server-side
    │ Limpa estado Zustand
    └─ window.location.href = '/login'
```

## Cookie

| Atributo  | Valor                               |
|-----------|-------------------------------------|
| Nome      | `__uau_session`                     |
| Conteúdo  | `JSON.stringify({accessToken, user})` |
| httpOnly  | `true`                              |
| secure    | `true` em produção, `false` em dev  |
| sameSite  | `'lax'`                             |
| path      | `'/'`                               |
| maxAge    | `604800` (7 dias)                   |

O cookie armazena tanto `accessToken` quanto `user` em JSON para evitar cookies múltiplos e chamadas adicionais ao backend na restauração.

## Middleware (server-side)

Criar `middleware.ts` na raiz de `src/` para proteção server-side de rotas:

- Rotas protegidas (`/admin/*`, `/franchise/*`, `/partner/*`, `/operator/*`): redireciona para `/login` se cookie ausente.
- Rota `/login`: redireciona para `/` se cookie presente (evita re-login).
- Não valida assinatura JWT — apenas presença do cookie. Validação real ocorre no backend ao usar o token.

## Arquivos

### Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/api/auth/route.ts` | `POST` login, `DELETE` logout |
| `src/app/api/auth/session/route.ts` | `GET` restore session |
| `src/middleware.ts` | Redirecionamento server-side por cookie |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/auth/auth.store.ts` | Remove `localStorage`; `restoreSession` vira `async`; `login`/`logout` chamam proxy |
| `src/auth/auth.api.ts` | `loginRequest` passa a chamar `POST /api/auth` (proxy Next.js) via `fetch` |

### Sem mudança

- `src/auth/auth-session.ts` — interface de token em memória, continua igual
- `src/api/client.ts` — interceptor Bearer continua igual
- `src/layout/ProtectedRoute.tsx` — já funciona com async restoreSession (não awaita)
- `src/app/page.tsx` — idem

## Contratos das rotas

### `POST /api/auth`
Request: `{ email: string, password: string }`
Response success: `{ success: true, data: { accessToken: string, user: ApiUser } }`
Response error: repassa o envelope de erro do backend
Side-effect: seta cookie `__uau_session`

### `DELETE /api/auth`
Response: `{ success: true }`
Side-effect: deleta cookie `__uau_session`

### `GET /api/auth/session`
Response success: `{ success: true, data: { accessToken: string, user: ApiUser } }`
Response sem cookie: `{ success: false, error: { message: 'No session' } }` (HTTP 401)

## Segurança: trade-offs documentados

- **O que melhora:** token não persiste em `localStorage`; inacessível via `document.cookie`; protegido por `SameSite=Lax` contra CSRF.
- **Limite:** durante sessão ativa, o token passa pela resposta de `GET /api/auth/session` (legível via XSS que faça fetch). Mitigação: CSP adequado no projeto.
- **Sem mudança no backend:** o backend não precisa saber que o token veio de um cookie.
