/**
 * Cobertura intencional: apenas fluxo de webhook (processWebhook).
 * Métodos de chamada à API Asaas (createCustomer, createSubscription,
 * listSubscriptionPayments, etc.) não são testados aqui pois são
 * wrappers de HTTP externo — testados via integração manual com
 * ambiente sandbox do Asaas.
 * Cobertura atual: ~33% (aceito conscientemente).
 */
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

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE', startedAt: new Date('2026-06-10') },
    });

    const originalPaidAt = new Date('2026-06-10T10:00:00.000Z');

    const result = await service.processWebhook(
      buildPaymentPayload(billing.asaasId!, '2026-06-11'),
    );

    expect(result.success).toBe(true);

    const unchangedBilling = await prisma.billingHistory.findUnique({
      where: { id: billing.id },
    });
    expect(unchangedBilling!.status).toBe('PAID');
    expect(unchangedBilling!.paidAt!.getTime()).toBe(originalPaidAt.getTime());
  });

  // ─── Cenário 3 — asaasId desconhecido ────────────────────────────────────

  it('cenário 3: asaasId inexistente retorna sem erro e sem escrita no banco', async () => {
    const beforeCount = await prisma.billingHistory.count();

    const result = await service.processWebhook(
      buildPaymentPayload('pay_totally_unknown_xyz_123'),
    );

    expect(result.success).toBe(true);

    const afterCount = await prisma.billingHistory.count();
    expect(afterCount).toBe(beforeCount);
  });
});
