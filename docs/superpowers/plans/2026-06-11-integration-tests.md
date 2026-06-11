# Integration Tests — 4 Fluxos Críticos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar testes de integração com Jest + Supertest para os 4 fluxos críticos do `uau-core-backend`, conectando ao banco Neon de dev via `DATABASE_URL`, com cleanup por DELETE após cada teste.

**Architecture:** Cada teste usa um `TestingModule` do NestJS com `PrismaService` real (banco dev) e dependências externas (Asaas) mockadas. Factories em `helpers.ts` criam fixtures isoladas por teste e um `TestCleanup` rastreia os IDs criados para deleção em `afterEach`, respeitando a ordem das FKs.

**Tech Stack:** Jest, ts-jest, @nestjs/testing, Supertest, Prisma (banco Neon dev), bcrypt

---

## ⚠️ BUGS ENCONTRADOS NA ANÁLISE — LEIA ANTES DE IMPLEMENTAR

### BUG 1 — SQL com nome de tabela errado em `referrals.service.ts`

**Localização:** [src/referrals/referrals.service.ts](uau-core-backend/src/referrals/referrals.service.ts) — métodos `getMyNetwork` (linha 58) e `getMyTree` (linha 115)

**Problema:** As queries raw SQL usam `"User"` (nome entre aspas duplas = case-sensitive no PostgreSQL). Mas a migration `20260513151216_init/migration.sql` cria a tabela como `"users"` (lowercase via `@@map("users")`). Em PostgreSQL, `"User"` ≠ `"users"`.

**Evidência:**
```sql
-- migration SQL (correto):
CREATE TABLE "users" (...)

-- raw SQL no service (ERRADO):
JOIN "User" u ON u.id = r."referredId"    -- linha 64
FROM "User" u WHERE u.id = ${userId}      -- linha 116
JOIN "User" u ON u.id = r."referredId"    -- linha 123
```

**Fix necessário:** Substituir `"User"` por `users` nas duas queries.

**Impacto:** `getMyNetwork` e `getMyTree` lançam `relation "User" does not exist` em qualquer chamada. **Pausar e comunicar ao usuário antes de continuar a implementação dos testes de referrals.**

---

### BUG 2 — Spec de checkout diverge do comportamento real (PENDENTE × ACTIVE/PAID)

**Localização:** [src/subscriptions/subscriptions.service.ts:178-208](uau-core-backend/src/subscriptions/subscriptions.service.ts)

**Problema:** O spec do usuário espera `subscription.status = ACTIVE` e `billing.status = PAID` imediatamente após o checkout. Mas `createDbRecord` cria ambos com `PENDING`. O status só muda para `ACTIVE`/`PAID` quando o webhook Asaas dispara `handlePaymentConfirmed`.

**Resolução:** Os testes de checkout (Tarefa 4) asseveram o comportamento **real** (`PENDING`), pois a ativação por webhook é responsabilidade do Teste 2.

---

## Mapeamento de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `package.json` | Modificar | Adicionar jest, ts-jest, supertest às devDeps + config jest |
| `src/test/setup.ts` | Criar | Carregar `.env`, conectar/desconectar Prisma |
| `src/test/helpers.ts` | Criar | Factories + TestCleanup + loginAs |
| `src/referrals/referrals.service.ts` | Modificar | Corrigir `"User"` → `users` nas 2 queries raw SQL |
| `src/checkout/checkout.service.spec.ts` | Criar | 3 cenários de checkout |
| `src/asaas/asaas.service.spec.ts` | Criar | 3 cenários de idempotência de webhook |
| `src/referrals/referrals.service.spec.ts` | Criar | 3 cenários de MMN |
| `src/anpr/anpr.controller.spec.ts` | Criar | 4 cenários de IDOR e2e |

---

## Task 0 — Instalar dependências e configurar Jest

**Files:**
- Modify: `uau-core-backend/package.json`

- [ ] **Step 1: Instalar dependências de teste**

```bash
cd uau-core-backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

- [ ] **Step 2: Adicionar scripts e configuração Jest no package.json**

No objeto `"scripts"` adicionar (depois de `"typecheck"`):
```json
"test": "jest",
"test:cov": "jest --coverage",
"test:watch": "jest --watch"
```

No final do objeto raiz do `package.json`, adicionar (antes do `}`):
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": ["ts-jest", { "tsconfig": "tsconfig.json" }]
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s",
    "!**/*.module.ts",
    "!main.ts",
    "!**/dto/**",
    "!**/node_modules/**"
  ],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "setupFiles": ["<rootDir>/test/setup.ts"],
  "maxWorkers": 1,
  "testTimeout": 30000
}
```

> `maxWorkers: 1` garante execução serial — essencial para banco compartilhado.

- [ ] **Step 3: Verificar que ts-jest funciona**

```bash
cd uau-core-backend
npx ts-jest config:show
```

Expected: JSON de configuração ts-jest sem erros.

---

## Task 1 — Criar `src/test/setup.ts`

**Files:**
- Create: `uau-core-backend/src/test/setup.ts`

- [ ] **Step 1: Criar o arquivo de setup global**

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis do .env na raiz do projeto (uau-core-backend/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Garante que env vars mínimas estão definidas para o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-key-integration';
process.env.ANPR_WEBHOOK_SECRET ??= 'test-anpr-secret';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:3001';
process.env.ASAAS_API_KEY ??= 'test-asaas-key';
process.env.ASAAS_WEBHOOK_TOKEN ??= 'test-webhook-token';
process.env.RATE_LIMIT_TTL ??= '60000';
process.env.RATE_LIMIT_MAX ??= '100';

// DIRECT_URL necessário pelo schema Prisma (Neon connection pooling)
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
```

> Não exporta nada — é executado via `setupFiles` pelo Jest automaticamente.

---

## Task 2 — Criar `src/test/helpers.ts`

**Files:**
- Create: `uau-core-backend/src/test/helpers.ts`

- [ ] **Step 1: Criar factories e TestCleanup**

```typescript
import { INestApplication } from '@nestjs/common';
import { PrismaClient, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { randomBytes } from 'crypto';

export const TEST_PASSWORD = 'Test@123456';

function uid(): string {
  return randomBytes(6).toString('hex');
}

// ─── Cleanup tracker ───────────────────────────────────────────────────────

export class TestCleanup {
  private records = new Map<string, Set<string>>();

  track(table: string, id: string) {
    if (!this.records.has(table)) this.records.set(table, new Set());
    this.records.get(table)!.add(id);
  }

  ids(table: string): string[] {
    return [...(this.records.get(table) ?? [])];
  }

  async flush(prisma: PrismaClient) {
    // Deleção em ordem que respeita FKs (filhos antes dos pais)
    const walletIds = this.ids('wallets');
    const unitIds = this.ids('franchiseUnits');
    const userIds = this.ids('users');

    if (walletIds.length > 0) {
      await prisma.walletMovement.deleteMany({ where: { walletId: { in: walletIds } } });
    }
    const shiftIds = this.ids('shifts');
    if (shiftIds.length > 0) {
      await prisma.attendance.deleteMany({ where: { shiftId: { in: shiftIds } } });
      await prisma.shift.deleteMany({ where: { id: { in: shiftIds } } });
    }
    const billingIds = this.ids('billingHistory');
    if (billingIds.length > 0) {
      await prisma.billingHistory.deleteMany({ where: { id: { in: billingIds } } });
    }
    const subIds = this.ids('subscriptions');
    if (subIds.length > 0) {
      await prisma.subscription.deleteMany({ where: { id: { in: subIds } } });
    }
    if (walletIds.length > 0) {
      await prisma.wallet.deleteMany({ where: { id: { in: walletIds } } });
    }
    const vehicleIds = this.ids('vehicles');
    if (vehicleIds.length > 0) {
      await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
    }
    if (userIds.length > 0) {
      await prisma.referral.deleteMany({ where: { referrerId: { in: userIds } } });
    }
    const customerIds = this.ids('customers');
    if (customerIds.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    }
    if (unitIds.length > 0) {
      await prisma.anprEvent.deleteMany({ where: { unitId: { in: unitIds } } });
      await prisma.unitStaff.deleteMany({ where: { unitId: { in: unitIds } } });
      await prisma.franchiseUnit.deleteMany({ where: { id: { in: unitIds } } });
    }
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    const planIds = this.ids('plans');
    if (planIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: planIds } } });
    }
    const cityIds = this.ids('cities');
    if (cityIds.length > 0) {
      await prisma.city.deleteMany({ where: { id: { in: cityIds } } });
    }
    const stateIds = this.ids('states');
    if (stateIds.length > 0) {
      await prisma.state.deleteMany({ where: { id: { in: stateIds } } });
    }

    this.records.clear();
  }
}

// ─── Factories ──────────────────────────────────────────────────────────────

export async function createTestUser(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  role: UserRole,
  overrides: Record<string, unknown> = {},
): Promise<User> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: `Test ${role} ${uid()}`,
      email: `test-${role.toLowerCase()}-${uid()}@test.uauplus.internal`,
      passwordHash,
      role,
      status: 'ACTIVE',
      ...overrides,
    },
  });
  cleanup.track('users', user.id);
  return user;
}

export async function createTestCustomer(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  overrides: Record<string, unknown> = {},
) {
  const user = await createTestUser(prisma, cleanup, 'CUSTOMER', {
    name: `Customer ${uid()}`,
    email: `customer-${uid()}@test.uauplus.internal`,
  });

  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      cpf: `${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      phone: '11999999999',
      ...overrides,
    },
  });
  cleanup.track('customers', customer.id);

  const wallet = await prisma.wallet.create({
    data: { customerId: customer.id },
  });
  cleanup.track('wallets', wallet.id);

  return { user, customer, wallet };
}

export async function createTestPlan(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  overrides: Record<string, unknown> = {},
) {
  const plan = await prisma.plan.create({
    data: {
      name: `Plano Teste ${uid()}`,
      price: 99.90,
      isActive: true,
      allowAllDays: true,
      ...overrides,
    },
  });
  cleanup.track('plans', plan.id);
  return plan;
}

export async function createTestState(prisma: PrismaClient, cleanup: TestCleanup) {
  const state = await prisma.state.create({
    data: {
      name: `Estado Teste ${uid()}`,
      code: uid().slice(0, 2).toUpperCase(),
      isActive: true,
    },
  });
  cleanup.track('states', state.id);
  return state;
}

export async function createTestCity(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  stateId: string,
) {
  const city = await prisma.city.create({
    data: {
      name: `Cidade Teste ${uid()}`,
      stateId,
      isActive: true,
    },
  });
  cleanup.track('cities', city.id);
  return city;
}

export async function createTestFranchiseUnit(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  overrides: Record<string, unknown> = {},
) {
  const state = await createTestState(prisma, cleanup);
  const city = await createTestCity(prisma, cleanup, state.id);

  const unit = await prisma.franchiseUnit.create({
    data: {
      name: `Unidade Teste ${uid()}`,
      stateId: state.id,
      cityId: city.id,
      address: 'Rua Teste, 123',
      neighborhood: 'Centro',
      zipCode: '01310-100',
      isActive: true,
      ...overrides,
    },
  });
  cleanup.track('franchiseUnits', unit.id);
  return { unit, state, city };
}

export async function createTestVehicle(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  customerId: string,
  overrides: Record<string, unknown> = {},
) {
  const vehicle = await prisma.vehicle.create({
    data: {
      customerId,
      plate: `TST${uid().slice(0, 4).toUpperCase()}`,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      isActive: true,
      ...overrides,
    },
  });
  cleanup.track('vehicles', vehicle.id);
  return vehicle;
}

export async function createTestSubscription(
  prisma: PrismaClient,
  cleanup: TestCleanup,
  customerId: string,
  planId: string,
  billingOverrides: Record<string, unknown> = {},
) {
  const subscription = await prisma.subscription.create({
    data: {
      customerId,
      planId,
      status: 'PENDING',
      asaasId: `sub_test_${uid()}`,
    },
  });
  cleanup.track('subscriptions', subscription.id);

  const billing = await prisma.billingHistory.create({
    data: {
      customerId,
      subscriptionId: subscription.id,
      amount: 99.90,
      status: 'PENDING',
      asaasId: `pay_test_${uid()}`,
      dueDate: new Date(),
      ...billingOverrides,
    },
  });
  cleanup.track('billingHistory', billing.id);

  return { subscription, billing };
}

// ─── Auth helper ────────────────────────────────────────────────────────────

export async function loginAs(app: INestApplication, user: User): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: TEST_PASSWORD });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `loginAs falhou para ${user.email}: HTTP ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }

  const token = res.body?.data?.accessToken ?? res.body?.accessToken;
  if (!token) throw new Error(`Token não encontrado na resposta: ${JSON.stringify(res.body)}`);
  return token;
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
cd uau-core-backend
npx tsc --noEmit
```

Expected: Sem erros de tipo.

---

## Task 3 — Fix bug SQL em `referrals.service.ts`

> ⚠️ **PAUSAR** antes desta tarefa — confirmar com o usuário que o fix está autorizado.

**Files:**
- Modify: `uau-core-backend/src/referrals/referrals.service.ts`

**Problema:** `"User"` (case-sensitive no PostgreSQL) deve ser `users` (nome real da tabela conforme migration `20260513151216_init`).

- [ ] **Step 1: Corrigir `getMyNetwork` (linha ~64)**

Localizar:
```sql
JOIN "User" u ON u.id = r."referredId"
WHERE r."referrerId" = ${userId}
```
(aparece 3 vezes — 1 para line1, 1 para line2, 1 para line3)

Substituir cada ocorrência de `"User"` por `users`.

Query corrigida deve ser:
```sql
      WITH
        line1 AS (
          SELECT u.id, u."name", u."createdAt", 1 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" = ${userId}
        ),
        line2 AS (
          SELECT u.id, u."name", u."createdAt", 2 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" IN (SELECT id FROM line1)
        ),
        line3 AS (
          SELECT u.id, u."name", u."createdAt", 3 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" IN (SELECT id FROM line2)
        )
```

- [ ] **Step 2: Corrigir `getMyTree` (linha ~116)**

Localizar:
```sql
        FROM "User" u
        WHERE u.id = ${userId}
        ...
        JOIN "User" u ON u.id = r."referredId"
```

Substituir ambas as ocorrências de `"User"` por `users`.

Query corrigida:
```sql
      WITH RECURSIVE tree AS (
        SELECT
          u.id,
          u."name",
          CAST(0 AS INTEGER)  AS depth,
          NULL::text          AS "parentId"
        FROM users u
        WHERE u.id = ${userId}

        UNION ALL

        SELECT
          u.id,
          u."name",
          CAST(t.depth + 1 AS INTEGER),
          r."referrerId" AS "parentId"
        FROM referrals r
        JOIN users u ON u.id = r."referredId"
        JOIN tree    t ON r."referrerId" = t.id
        WHERE t.depth < ${MAX_TREE_DEPTH}
      )
```

- [ ] **Step 3: Verificar compilação e commit do fix**

```bash
cd uau-core-backend
npx tsc --noEmit
```

```bash
git add uau-core-backend/src/referrals/referrals.service.ts
git commit -m "fix(referrals): correct raw SQL table name User → users (migration uses @@map('users'))"
```

---

## Task 4 — `src/checkout/checkout.service.spec.ts`

**Files:**
- Create: `uau-core-backend/src/checkout/checkout.service.spec.ts`

**Estratégia:** TestingModule com PrismaService real + AsaasService mockado. Cenários 1 e 2 verificam comportamento normal (status PENDING conforme código real). Cenário 3 usa `jest.spyOn` para simular falha dentro da transação.

- [ ] **Step 1: Escrever o arquivo de teste completo**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';
import { UserRole } from '@prisma/client';
import {
  TestCleanup,
  createTestCustomer,
  createTestPlan,
  createTestVehicle,
} from '../test/helpers';

const ASAAS_SUB_ID = 'sub_test_integration';
const ASAAS_PAY_ID = 'pay_test_integration';
const ASAAS_CUS_ID = 'cus_test_integration';

function buildMockAsaas() {
  return {
    createCustomer: jest.fn().mockResolvedValue({ id: ASAAS_CUS_ID }),
    createSubscription: jest.fn().mockResolvedValue({ id: ASAAS_SUB_ID }),
    listSubscriptionPayments: jest.fn().mockResolvedValue([
      {
        id: ASAAS_PAY_ID,
        dueDate: '2026-06-11',
        value: 99.90,
        invoiceUrl: null,
        bankSlipUrl: null,
        bankSlipBarCode: null,
      },
    ]),
    resolveFirstSubscriptionPayment: jest.fn().mockResolvedValue({
      id: ASAAS_PAY_ID,
      dueDate: '2026-06-11',
      value: 99.90,
      invoiceUrl: null,
      bankSlipUrl: null,
      bankSlipBarCode: null,
    }),
    getPaymentPixQrCode: jest.fn().mockResolvedValue(null),
  };
}

describe('CheckoutService — integração', () => {
  let module: TestingModule;
  let service: CheckoutService;
  let walletService: WalletService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    const mockAsaas = buildMockAsaas();

    module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        SubscriptionsService,
        WalletService,
        PrismaService,
        { provide: AsaasService, useValue: mockAsaas },
      ],
    }).compile();

    service = module.get(CheckoutService);
    walletService = module.get(WalletService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
    jest.restoreAllMocks(); // restaura spyOn sobrescrito em testes de atomicidade
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  // ─── Cenário 1 — Checkout com saldo suficiente ───────────────────────────

  it('cenário 1: checkout com saldo de R$30 aplica cashback e cria subscription+billing PENDING', async () => {
    const { user, customer, wallet } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { price: 99.90 });
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    // Carrega R$30 de saldo real na wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: 30.00 },
    });

    const dto = {
      planId: plan.id,
      vehicleId: vehicle.id,
      paymentMethod: 'PIX',
    } as any;

    const result = await service.confirmSubscription(user as any, dto);

    // Verifica resposta
    expect(result.subscriptionId).toBeDefined();
    expect(result.billingCycleId).toBeDefined();
    expect(result.totalCashbackUsed).toBe(30);
    expect(result.gatewayAmount).toBe(69.90);

    // Verifica subscription no banco — status PENDING (ACTIVE vem via webhook Asaas)
    const sub = await prisma.subscription.findUnique({ where: { id: result.subscriptionId } });
    expect(sub).not.toBeNull();
    expect(sub!.status).toBe('PENDING');
    cleanup.track('subscriptions', sub!.id);

    // Verifica billing no banco — status PENDING (PAID vem via webhook Asaas)
    const billing = await prisma.billingHistory.findUnique({ where: { id: result.billingCycleId } });
    expect(billing).not.toBeNull();
    expect(billing!.status).toBe('PENDING');
    cleanup.track('billingHistory', billing!.id);

    // Verifica wallet debitada corretamente
    const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(updatedWallet!.balance)).toBe(0);

    // Invariante: toda subscription tem billing associado
    const billingCount = await prisma.billingHistory.count({
      where: { subscriptionId: sub!.id },
    });
    expect(billingCount).toBeGreaterThan(0);
  });

  // ─── Cenário 2 — Checkout sem cashback ──────────────────────────────────

  it('cenário 2: checkout com wallet zerada cria subscription PENDING sem alterar wallet', async () => {
    const { user, customer, wallet } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { price: 99.90 });
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    // Wallet com balance = 0 (padrão da factory)
    expect(Number(wallet.balance)).toBe(0);

    const dto = {
      planId: plan.id,
      vehicleId: vehicle.id,
      paymentMethod: 'BOLETO',
    } as any;

    const result = await service.confirmSubscription(user as any, dto);

    // Nenhum cashback utilizado
    expect(result.totalCashbackUsed).toBe(0);
    expect(result.gatewayAmount).toBe(99.90);

    const sub = await prisma.subscription.findUnique({ where: { id: result.subscriptionId } });
    expect(sub).not.toBeNull();
    cleanup.track('subscriptions', sub!.id);

    const billing = await prisma.billingHistory.findUnique({ where: { id: result.billingCycleId } });
    expect(billing).not.toBeNull();
    cleanup.track('billingHistory', billing!.id);

    // Wallet inalterada
    const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(updatedWallet!.balance)).toBe(0);
    expect(Number(updatedWallet!.promoBalance)).toBe(0);
  });

  // ─── Cenário 3 — Atomicidade: falha no debit reverte subscription e billing ─

  it('cenário 3: erro em applyCashbackUsageTx reverte subscription e billing (rollback)', async () => {
    const { user, customer, wallet } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { price: 99.90 });
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    // Carrega saldo para que totalCashbackUsed > 0 e o if(wallet) seja verdadeiro
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: 30.00 },
    });

    // Simula falha no debit dentro da transação
    jest
      .spyOn(walletService, 'applyCashbackUsageTx')
      .mockRejectedValue(new Error('simulated debit failure'));

    const dto = {
      planId: plan.id,
      vehicleId: vehicle.id,
      paymentMethod: 'PIX',
    } as any;

    await expect(service.confirmSubscription(user as any, dto)).rejects.toThrow();

    // Verifica que subscription NÃO foi criada (rollback)
    const subs = await prisma.subscription.findMany({
      where: { customerId: customer.id },
    });
    expect(subs).toHaveLength(0);

    // Verifica que billing NÃO foi criado (rollback)
    const billings = await prisma.billingHistory.findMany({
      where: { customerId: customer.id },
    });
    expect(billings).toHaveLength(0);

    // Wallet inalterada (mock não chegou a ser executado no banco)
    const unchangedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(unchangedWallet!.balance)).toBe(30);
  });
});
```

- [ ] **Step 2: Rodar apenas este arquivo**

```bash
cd uau-core-backend
npx jest checkout.service.spec.ts --verbose
```

Expected: 3 testes passando. Se falhar, investigar saída antes de continuar.

---

## Task 5 — `src/asaas/asaas.service.spec.ts`

**Files:**
- Create: `uau-core-backend/src/asaas/asaas.service.spec.ts`

**Estratégia:** Testa `handlePaymentConfirmed` (método privado) via `processWebhook` (método público). Usa banco real para criar BillingHistory com status PENDING e asaasId definido, depois verifica a mutação.

- [ ] **Step 1: Escrever o arquivo de teste**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AsaasService } from './asaas.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  TestCleanup,
  createTestCustomer,
  createTestPlan,
  createTestSubscription,
} from '../test/helpers';

describe('AsaasService.processWebhook — idempotência', () => {
  let module: TestingModule;
  let service: AsaasService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [AsaasService, PrismaService],
    }).compile();

    service = module.get(AsaasService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  function buildPaymentPayload(asaasPaymentId: string, paymentDate?: string) {
    return {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: asaasPaymentId,
        paymentDate: paymentDate ?? '2026-06-11',
      },
    };
  }

  // ─── Cenário 1 — Primeiro disparo processa normalmente ───────────────────

  it('cenário 1: primeiro disparo atualiza billing para PAID e subscription para ACTIVE', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const { subscription, billing } = await createTestSubscription(
      prisma, cleanup, customer.id, plan.id,
    );

    expect(billing.status).toBe('PENDING');

    await service.processWebhook(buildPaymentPayload(billing.asaasId!));

    const updatedBilling = await prisma.billingHistory.findUnique({
      where: { id: billing.id },
    });
    expect(updatedBilling!.status).toBe('PAID');
    expect(updatedBilling!.paidAt).not.toBeNull();

    const updatedSub = await prisma.subscription.findUnique({
      where: { id: subscription.id },
    });
    expect(updatedSub!.status).toBe('ACTIVE');
    expect(updatedSub!.startedAt).not.toBeNull();
  });

  // ─── Cenário 2 — Segundo disparo é ignorado (idempotência) ───────────────

  it('cenário 2: segundo disparo com billing já PAID não altera paidAt (idempotência)', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const { subscription, billing } = await createTestSubscription(
      prisma, cleanup, customer.id, plan.id,
      {
        status: 'PAID',
        paidAt: new Date('2026-06-10T10:00:00.000Z'),
      },
    );

    // Atualiza subscription para ACTIVE também (estado consistente)
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE', startedAt: new Date('2026-06-10') },
    });

    const originalPaidAt = new Date('2026-06-10T10:00:00.000Z');

    // Segundo disparo com paymentDate diferente — não deve sobrescrever paidAt
    const result = await service.processWebhook(
      buildPaymentPayload(billing.asaasId!, '2026-06-11'),
    );

    // A função retorna { success: true } mesmo no caminho de idempotência
    // (o retorno interno do handlePaymentConfirmed não é propagado pelo processWebhook)
    expect(result.success).toBe(true);

    // paidAt NÃO foi alterado
    const unchangedBilling = await prisma.billingHistory.findUnique({
      where: { id: billing.id },
    });
    expect(unchangedBilling!.status).toBe('PAID');
    expect(unchangedBilling!.paidAt!.getTime()).toBe(originalPaidAt.getTime());
  });

  // ─── Cenário 3 — asaasId desconhecido ────────────────────────────────────

  it('cenário 3: asaasId inexistente retorna sem erro e sem escrita no banco', async () => {
    const beforeCount = await prisma.billingHistory.count();

    // Nenhum billing tem esse asaasId
    const result = await service.processWebhook(
      buildPaymentPayload('pay_totally_unknown_xyz_123'),
    );

    expect(result.success).toBe(true);

    // Nenhuma nova escrita
    const afterCount = await prisma.billingHistory.count();
    expect(afterCount).toBe(beforeCount);
  });
});
```

- [ ] **Step 2: Rodar apenas este arquivo**

```bash
cd uau-core-backend
npx jest asaas.service.spec.ts --verbose
```

Expected: 3 testes passando.

---

## Task 6 — `src/referrals/referrals.service.spec.ts`

> ⚠️ Requer que o Bug 1 (Task 3) já tenha sido corrigido.

**Files:**
- Create: `uau-core-backend/src/referrals/referrals.service.spec.ts`

- [ ] **Step 1: Escrever o arquivo de teste**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestCleanup, createTestUser } from '../test/helpers';

describe('ReferralsService — rede MMN', () => {
  let module: TestingModule;
  let service: ReferralsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [ReferralsService, PrismaService],
    }).compile();

    service = module.get(ReferralsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  async function createChain(length: number) {
    const users = [];
    for (let i = 0; i < length; i++) {
      const u = await createTestUser(prisma, cleanup, 'CUSTOMER');
      users.push(u);
    }
    // Cria referrals: users[0] → users[1] → users[2] → ...
    for (let i = 1; i < users.length; i++) {
      await prisma.referral.create({
        data: { referrerId: users[i - 1].id, referredId: users[i].id },
      });
      // Referrals são deletados no flush via referrerId (tracked nos userIds)
    }
    return users;
  }

  // ─── Cenário 1 — getMyNetwork retorna 3 linhas corretamente ──────────────

  it('cenário 1: getMyNetwork de userA retorna B em line1, C em line2, D em line3', async () => {
    // Árvore: A → B → C → D
    const [userA, userB, userC, userD] = await createChain(4);

    const network = await service.getMyNetwork(userA.id);

    const line1Ids = network.line1.map((u: any) => u.id);
    const line2Ids = network.line2.map((u: any) => u.id);
    const line3Ids = network.line3.map((u: any) => u.id);

    expect(line1Ids).toContain(userB.id);
    expect(line2Ids).toContain(userC.id);
    expect(line3Ids).toContain(userD.id);

    // userD não aparece em linhas erradas
    expect(line1Ids).not.toContain(userD.id);
    expect(line2Ids).not.toContain(userD.id);
  });

  // ─── Cenário 2 — getMyTree respeita MAX_TREE_DEPTH = 10 ──────────────────

  it('cenário 2: cadeia de 12 usuários — getMyTree retorna no máximo profundidade 10', async () => {
    // Cria 12 usuários em cadeia: u[0] → u[1] → ... → u[11]
    const users = await createChain(12);

    const tree = await service.getMyTree(users[0].id) as any;

    // Função recursiva para encontrar profundidade máxima na árvore retornada
    function maxDepth(node: any, depth = 0): number {
      if (!node.children || node.children.length === 0) return depth;
      return Math.max(...node.children.map((c: any) => maxDepth(c, depth + 1)));
    }

    const depth = maxDepth(tree);
    expect(depth).toBeLessThanOrEqual(10);

    // Não lançou erro, não entrou em loop — verificado pelo próprio timeout do teste (30s)
    expect(tree.id).toBe(users[0].id);
  });

  // ─── Cenário 3 — TODO cashback de referral ───────────────────────────────

  it('TODO: cashback de referral por linha — lógica não implementada ainda', () => {
    // O sistema atual registra apenas a rede (3 linhas).
    // Não há cálculo de comissão automático por linha de referral.
    // Quando implementado, testar:
    //   - Comissão linha 1: X%
    //   - Comissão linha 2: Y%
    //   - Comissão linha 3: Z%
    //   - Crédito na carteira do referenciador ao ativar assinatura do indicado
    expect(true).toBe(true); // placeholder
  });
});
```

> Nota: `_ = ref` suprime TS lint de variável não utilizada. Pode também remover a variável.

- [ ] **Step 2: Rodar apenas este arquivo**

```bash
cd uau-core-backend
npx jest referrals.service.spec.ts --verbose
```

Expected: 3 testes passando (cenário 3 é placeholder).

---

## Task 7 — `src/anpr/anpr.controller.spec.ts` (e2e com Supertest)

**Files:**
- Create: `uau-core-backend/src/anpr/anpr.controller.spec.ts`

**Estratégia:** Usa AppModule completo (full e2e) com override do ThrottlerGuard. A criação dos usuários OPERATOR e SUPER_ADMIN usa as factories; o OPERATOR tem `defaultUnitId` apontando para uma unidade real criada no banco. A verificação de IDOR de billing (cenário 4) requer Shift+Attendance para acionar o filtro real do BillingService.

- [ ] **Step 1: Escrever o arquivo de teste completo**

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  TestCleanup,
  createTestUser,
  createTestCustomer,
  createTestFranchiseUnit,
  createTestPlan,
  createTestSubscription,
  loginAs,
} from '../test/helpers';

describe('ANPR & Billing — IDOR e2e (Supertest)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true }) // evita rate-limiting nos testes
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
  });

  afterEach(async () => {
    await cleanup.flush(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Cenário 1 — OPERATOR acessa sua própria unidade ─────────────────────

  it('cenário 1: OPERATOR com defaultUnitId=unitA acessa GET /anpr/events/:unitA → 200', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);

    const operator = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unit.id,
    });

    const token = await loginAs(app, operator);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ─── Cenário 2 — OPERATOR tenta acessar outra unidade → 403 ─────────────

  it('cenário 2: OPERATOR tenta GET /anpr/events/:unitB (não é sua unidade) → 403', async () => {
    const { unit: unitA } = await createTestFranchiseUnit(prisma, cleanup);
    const { unit: unitB } = await createTestFranchiseUnit(prisma, cleanup);

    const operator = await createTestUser(prisma, cleanup, 'OPERATOR', {
      defaultUnitId: unitA.id,
    });

    const token = await loginAs(app, operator);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unitB.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  // ─── Cenário 3 — SUPER_ADMIN acessa qualquer unidade ─────────────────────

  it('cenário 3: SUPER_ADMIN acessa GET /anpr/events/:qualquerUnidade → 200', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);

    const admin = await createTestUser(prisma, cleanup, 'SUPER_ADMIN');
    const token = await loginAs(app, admin);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/anpr/events/${unit.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // ─── Cenário 4 — FRANCHISE_OWNER isolamento em /billing ──────────────────

  it('cenário 4: FRANCHISE_OWNER só vê billings de clientes que visitaram sua unidade', async () => {
    // Cria duas unidades independentes
    const { unit: unitA } = await createTestFranchiseUnit(prisma, cleanup);
    const { unit: unitB } = await createTestFranchiseUnit(prisma, cleanup);

    // Cria franqueados para cada unidade
    const ownerA = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER', {
      defaultUnitId: unitA.id,
    });
    const ownerB = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER', {
      defaultUnitId: unitB.id,
    });

    // Cria clientes com billings
    const plan = await createTestPlan(prisma, cleanup);
    const { customer: customerA } = await createTestCustomer(prisma, cleanup);
    const { customer: customerB } = await createTestCustomer(prisma, cleanup);

    const { billing: billingA } = await createTestSubscription(
      prisma, cleanup, customerA.id, plan.id,
    );
    const { billing: billingB } = await createTestSubscription(
      prisma, cleanup, customerB.id, plan.id,
    );

    // Cria Shift para unitA e Attendance de customerA nesse shift
    // (necessário para que o filtro billing.customer.attendances.shift.unitId funcione)
    const operator = await createTestUser(prisma, cleanup, 'OPERATOR', { defaultUnitId: unitA.id });
    const shiftA = await prisma.shift.create({
      data: { unitId: unitA.id, operatorId: operator.id, status: 'OPEN' },
    });
    cleanup.track('shifts', shiftA.id);

    await prisma.attendance.create({
      data: {
        shiftId: shiftA.id,
        customerId: customerA.id,
        plate: 'TST0001',
        status: 'COMPLETED',
      },
    });

    // Cria Shift para unitB e Attendance de customerB
    const operatorB = await createTestUser(prisma, cleanup, 'OPERATOR', { defaultUnitId: unitB.id });
    const shiftB = await prisma.shift.create({
      data: { unitId: unitB.id, operatorId: operatorB.id, status: 'OPEN' },
    });
    cleanup.track('shifts', shiftB.id);

    await prisma.attendance.create({
      data: {
        shiftId: shiftB.id,
        customerId: customerB.id,
        plate: 'TST0002',
        status: 'COMPLETED',
      },
    });

    const tokenA = await loginAs(app, ownerA);
    const tokenB = await loginAs(app, ownerB);

    // ownerA só vê billings de customerA
    const resA = await request(app.getHttpServer())
      .get('/api/v1/billing')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    const billingIdsA = resA.body.data?.data?.map((b: any) => b.id) ?? [];
    expect(billingIdsA).toContain(billingA.id);
    expect(billingIdsA).not.toContain(billingB.id);

    // ownerB só vê billings de customerB
    const resB = await request(app.getHttpServer())
      .get('/api/v1/billing')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    const billingIdsB = resB.body.data?.data?.map((b: any) => b.id) ?? [];
    expect(billingIdsB).toContain(billingB.id);
    expect(billingIdsB).not.toContain(billingA.id);
  });
});
```

> **Nota sobre os guards:** O JwtAuthGuard e RolesGuard são testados com tokens JWT reais (gerados via `loginAs`). Apenas o ThrottlerGuard é desabilitado para evitar rate-limiting durante os testes.

- [ ] **Step 2: Rodar apenas este arquivo**

```bash
cd uau-core-backend
npx jest anpr.controller.spec.ts --verbose
```

Expected: 4 testes passando.

---

## Task 8 — Verificação final

- [ ] **Step 1: Rodar todos os testes**

```bash
cd uau-core-backend
npm test
```

Expected: 13 testes passando (3 + 3 + 3 + 4).

- [ ] **Step 2: Verificar cobertura nos 4 arquivos**

```bash
cd uau-core-backend
npm run test:cov -- --collectCoverageFrom='src/checkout/checkout.service.ts' --collectCoverageFrom='src/asaas/asaas.service.ts' --collectCoverageFrom='src/referrals/referrals.service.ts' --collectCoverageFrom='src/anpr/anpr.controller.ts'
```

Expected: ≥ 80% de branches/statements em cada arquivo.

- [ ] **Step 3: Verificar TypeScript sem erros**

```bash
cd uau-core-backend
npx tsc --noEmit
```

Expected: Sem erros.

---

## Problemas Conhecidos / Pontos de Atenção

### 1. `overrideProvider(APP_GUARD)` no e2e

O NestJS registra os guards globais como `APP_GUARD` tokens em `AppModule`. No e2e, sobreescrever apenas o `ThrottlerGuard` é suficiente. O `JwtAuthGuard` e `RolesGuard` devem ser testados com tokens JWT reais (o que `loginAs` faz).

### 2. `DIRECT_URL` no schema Prisma

O schema usa `directUrl = env("DIRECT_URL")` para conexões diretas (Neon). O `setup.ts` define `DIRECT_URL ??= DATABASE_URL` como fallback. Se o banco exigir conexão direta (ex: Neon serverless), ambas podem ter o mesmo valor.

### 3. Limpeza de Attendances

O `TestCleanup.flush` deleta attendances via `shiftId`. As attendances criadas no cenário 4 são deletadas quando o shift é deletado (via CASCADE ou via `flush`). Verificar se há constraint de FK com `ON DELETE CASCADE` ou se é necessário deletar attendances explicitamente antes dos shifts.

### 4. Tempo de execução

Com `maxWorkers: 1`, todos os 13 testes rodam serialmente. Cada teste faz múltiplas queries ao banco Neon (latência de rede). Esperar ~30–60 segundos para o suite completo.

### 5. Mock do `processWebhook` × retorno de idempotência

O método `handlePaymentConfirmed` retorna `{ received: true, skipped: true }` para billing já PAID, mas `processWebhook` não propaga esse retorno — retorna sempre `{ success: true }`. O cenário 2 do Teste 2 verifica idempotência pelo estado do banco (paidAt inalterado), não pelo retorno da função.
