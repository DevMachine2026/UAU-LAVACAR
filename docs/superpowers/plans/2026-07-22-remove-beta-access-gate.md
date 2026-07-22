# Remover trava de betaAccess no login — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o bloqueio de login por `betaAccess: false`, para que qualquer usuário ativo consiga logar imediatamente após o cadastro.

**Architecture:** Mudança de uma única linha de lógica em `AuthService.login()` (`uau-core-backend/src/auth/auth.service.ts`), coberta por um teste de integração novo que usa banco de teste real (padrão já usado no repo via `TestCleanup`/`createTestUser`).

**Tech Stack:** NestJS, Prisma, Jest (`test:local` roda contra banco de teste isolado via `scripts/with-test-env.js` + `.env.test`).

## Global Constraints

- Não alterar `schema.prisma` (sem migration) — spec: `docs/superpowers/specs/2026-07-22-remove-beta-access-gate-design.md`.
- Não alterar o endpoint `PATCH /users/:id/beta-access` nem `BetaAccessDto` — ficam inertes.
- Não alterar `customers.service.ts` (fluxo de cadastro).
- Não alterar a tela de login do mobile (`app/(auth)/login.tsx`) — o link "Criar cadastro" já existe.
- Backend continua devolvendo mensagem genérica "Credenciais inválidas" para e-mail inexistente e para senha errada (não abrir enumeração de e-mail).

---

### Task 1: Remover a checagem de betaAccess no login, com teste de integração

**Files:**
- Modify: `uau-core-backend/src/auth/auth.service.ts:43-45`
- Test: `uau-core-backend/src/auth/auth.service.spec.ts` (novo arquivo — hoje não existe nenhum teste para `AuthService`)

**Interfaces:**
- Consumes: `createTestUser(prisma, cleanup, role, overrides)` e `TEST_PASSWORD` de `../test/helpers` (já existentes, usados por `referrals.service.spec.ts` e outros — assinatura: `createTestUser(prisma: PrismaClient, cleanup: TestCleanup, role: UserRole, overrides?: Record<string, unknown>): Promise<User>`, senha em texto plano sempre `TEST_PASSWORD = 'Test@123456'`).
- Produces: nada consumido por outras tasks (task única).

- [ ] **Step 1: Escrever o teste de integração (deve falhar com o código atual)**

Criar `uau-core-backend/src/auth/auth.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Mailer } from '../third-party/Mailer';
import { PrismaService } from '../prisma/prisma.service';
import { TestCleanup, TEST_PASSWORD, createTestUser, flushTestCleanup } from '../test/helpers';

describe('AuthService.login — gate de betaAccess', () => {
  let module: TestingModule;
  let service: AuthService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '8h' },
        }),
      ],
      providers: [
        AuthService,
        PrismaService,
        { provide: Mailer, useValue: { sendMessage: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await flushTestCleanup(cleanup, prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  it('permite login de um CUSTOMER com betaAccess: false', async () => {
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER', { betaAccess: false });

    const result = await service.login({ email: user.email, password: TEST_PASSWORD });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user.id).toBe(user.id);
  });

  it('continua bloqueando login de usuário com status diferente de ACTIVE', async () => {
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER', {
      betaAccess: false,
      status: 'INACTIVE',
    });

    await expect(
      service.login({ email: user.email, password: TEST_PASSWORD }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha do jeito esperado**

Rodar:
```bash
cd uau-core-backend && npm run test:local -- src/auth/auth.service.spec.ts
```
Esperado: o teste `'permite login de um CUSTOMER com betaAccess: false'` **FALHA**, com o erro lançado sendo `UnauthorizedException: Acesso restrito. Entre em contato para liberar seu acesso.` (o gate atual bloqueando). O segundo teste (`INACTIVE`) já passa, pois essa checagem não muda.

- [ ] **Step 3: Remover o gate em `auth.service.ts`**

Em `uau-core-backend/src/auth/auth.service.ts`, dentro de `login()`, remover este bloco (linhas 43-45):

```ts
    if (user.role !== UserRole.SUPER_ADMIN && !user.betaAccess) {
      throw new UnauthorizedException('Acesso restrito. Entre em contato para liberar seu acesso.');
    }

```

Ou seja, o método `login()` passa a ficar assim entre a checagem de status e a emissão do token:

```ts
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Conta bloqueada ou inativa');
    }

    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, jti };
    const accessToken = this.jwtService.sign(payload);
```

Se o import `UserRole` de `@prisma/client` (linha 9) ficar sem nenhum outro uso no arquivo depois dessa remoção, remover também esse import — confirmar com uma busca (`grep -n "UserRole" uau-core-backend/src/auth/auth.service.ts`) antes de decidir.

- [ ] **Step 4: Rodar o teste de novo e confirmar que passa**

Rodar:
```bash
cd uau-core-backend && npm run test:local -- src/auth/auth.service.spec.ts
```
Esperado: os 2 testes **PASSAM**.

- [ ] **Step 5: Rodar a suíte completa do backend pra garantir que nada mais quebrou**

Rodar:
```bash
cd uau-core-backend && npm run test:local
```
Esperado: todos os testes passam (mesma contagem de antes + 2 novos), sem nenhuma outra suíte (ex.: `users`, e2e de `auth`) esperando a mensagem "Acesso restrito".

- [ ] **Step 6: Commit**

```bash
cd uau-core-backend && git add src/auth/auth.service.ts src/auth/auth.service.spec.ts
git commit -m "$(cat <<'EOF'
fix(auth): remove gate de betaAccess no login

Novos cadastros e testadores da Play Store estavam sendo bloqueados no
login por betaAccess: false (default de novos usuários), sem nenhuma UI
pra liberar. Login agora depende só de status ACTIVE. Campo betaAccess
e o endpoint PATCH /users/:id/beta-access continuam existindo, inertes,
caso um beta fechado precise ser reativado no futuro.

EOF
)"
```

---

## Self-Review

**1. Cobertura da spec:**
- Remover a checagem que bloqueia login → Task 1, Step 3. ✅
- Não mexer em schema/migration → não há nenhum step tocando `schema.prisma`. ✅
- Não mexer no endpoint admin/DTO → não há nenhum step tocando `users.controller.ts`/`users.service.ts`. ✅
- Não mexer no fluxo de cadastro → não há nenhum step tocando `customers.service.ts`. ✅
- Não mexer na tela de login do mobile → não há nenhum step tocando `uau-mobile-app/`. ✅
- Testes cobrindo o comportamento novo e o que deve continuar bloqueado (`INACTIVE`) → Step 1. ✅

**2. Placeholder scan:** nenhum "TBD"/"implementar depois" — todo código e comando é literal. ✅

**3. Consistência de tipos:** `createTestUser` retorna `Promise<User>` (Prisma `User`), usado como `user.email`/`user.id` — bate com o retorno real de `service.login()` (`{ accessToken: string; user: Omit<User, 'passwordHash'> }`, já que `login()` faz spread removendo `passwordHash`). `TEST_PASSWORD` é a mesma constante usada em `helpers.ts:8`. ✅
