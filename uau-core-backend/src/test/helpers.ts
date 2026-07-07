import { INestApplication } from '@nestjs/common';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
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
      await prisma.welcomeBonusGrant.deleteMany({ where: { walletId: { in: walletIds } } });
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
      await prisma.dailyWash.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
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

export async function flushTestCleanup(
  cleanup: TestCleanup | undefined,
  prisma: PrismaClient | undefined,
) {
  if (!cleanup || !prisma) return;
  await cleanup.flush(prisma);
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
  subscriptionOverrides: Record<string, unknown> = {},
) {
  const subscription = await prisma.subscription.create({
    data: {
      customerId,
      planId,
      status: 'PENDING',
      asaasId: `sub_test_${uid()}`,
      ...subscriptionOverrides,
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

// Gera um JWT válido sem passar pelo endpoint de login (evita rate-limiting do /auth/login).
// Use em testes e2e onde múltiplos tokens são necessários no mesmo suite.
export function signJwt(app: INestApplication, user: User): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign({ sub: user.id, email: user.email, role: user.role });
}
