/**
 * Cobertura intencional: apenas validação de conflito de veículo em create().
 * A parte HTTP (resolveAsaasData) é bloqueada pelo throw do conflito antes de ser atingida,
 * portanto AsaasService é fornecido como mock vazio — nunca é chamado nesses cenários.
 */
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AsaasService } from '../asaas/asaas.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  TestCleanup,
  createTestCustomer,
  createTestPlan,
  createTestSubscription,
  createTestVehicle,
} from '../test/helpers';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService.create — conflito de veículo', () => {
  let module: TestingModule;
  let service: SubscriptionsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        PrismaService,
        { provide: AsaasService, useValue: {} },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
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

  // ─── Cenário 1 — veículo com assinatura ACTIVE bloqueia criação ──────────

  it('cenário 1: lança ConflictException quando veículo já tem assinatura ACTIVE', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    await createTestSubscription(prisma, cleanup, customer.id, plan.id, {}, {
      vehicleId: vehicle.id,
      status: 'ACTIVE',
    });

    await expect(
      service.create({ customerId: customer.id, planId: plan.id, vehicleId: vehicle.id }),
    ).rejects.toThrow(ConflictException);
  });

  // ─── Cenário 2 — veículo com assinatura OVERDUE também bloqueia ──────────

  it('cenário 2: lança ConflictException quando veículo já tem assinatura OVERDUE', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    await createTestSubscription(prisma, cleanup, customer.id, plan.id, {}, {
      vehicleId: vehicle.id,
      status: 'OVERDUE',
    });

    await expect(
      service.create({ customerId: customer.id, planId: plan.id, vehicleId: vehicle.id }),
    ).rejects.toThrow(ConflictException);
  });

  // ─── Cenário 3 — assinatura CANCELLED não bloqueia criação nova ──────────

  it('cenário 3: assinatura CANCELLED não lança ConflictException (passa para etapa seguinte)', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    await createTestSubscription(prisma, cleanup, customer.id, plan.id, {}, {
      vehicleId: vehicle.id,
      status: 'CANCELLED',
    });

    // O conflito não lança — a exceção vinda aqui é de outra natureza (AsaasService não configurado)
    const result = service.create({
      customerId: customer.id,
      planId: plan.id,
      vehicleId: vehicle.id,
    });
    await expect(result).rejects.not.toThrow(ConflictException);
  });

  // ─── Cenário 4 — sem vehicleId, a verificação de conflito é ignorada ─────

  it('cenário 4: sem vehicleId, não verifica conflito e avança para etapa de pagamento', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);

    const result = service.create({ customerId: customer.id, planId: plan.id });
    await expect(result).rejects.not.toThrow(ConflictException);
  });
});
