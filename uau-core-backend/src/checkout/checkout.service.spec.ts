import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';
import {
  TestCleanup,
  createTestCustomer,
  createTestPlan,
  createTestUser,
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
    jest.restoreAllMocks();
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

    expect(result.subscriptionId).toBeDefined();
    expect(result.billingCycleId).toBeDefined();
    expect(result.totalCashbackUsed).toBe(30);
    expect(result.gatewayAmount).toBe(69.90);

    // status PENDING — ACTIVE vem via webhook Asaas (Task 5)
    const sub = await prisma.subscription.findUnique({ where: { id: result.subscriptionId } });
    expect(sub).not.toBeNull();
    expect(sub!.status).toBe('PENDING');
    cleanup.track('subscriptions', sub!.id);

    // status PENDING — PAID vem via webhook Asaas (Task 5)
    const billing = await prisma.billingHistory.findUnique({ where: { id: result.billingCycleId } });
    expect(billing).not.toBeNull();
    expect(billing!.status).toBe('PENDING');
    cleanup.track('billingHistory', billing!.id);

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(updatedWallet!.balance)).toBe(0);

    // invariante: toda subscription tem ao menos um billing
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

    expect(Number(wallet.balance)).toBe(0);

    const dto = {
      planId: plan.id,
      vehicleId: vehicle.id,
      paymentMethod: 'BOLETO',
    } as any;

    const result = await service.confirmSubscription(user as any, dto);

    expect(result.totalCashbackUsed).toBe(0);
    expect(result.gatewayAmount).toBe(99.90);

    const sub = await prisma.subscription.findUnique({ where: { id: result.subscriptionId } });
    expect(sub).not.toBeNull();
    cleanup.track('subscriptions', sub!.id);

    const billing = await prisma.billingHistory.findUnique({ where: { id: result.billingCycleId } });
    expect(billing).not.toBeNull();
    cleanup.track('billingHistory', billing!.id);

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(updatedWallet!.balance)).toBe(0);
    expect(Number(updatedWallet!.promoBalance)).toBe(0);
  });

  // ─── Cenário 3 — Atomicidade: falha em applyCashbackUsageTx reverte tudo ─

  it('cenário 3: erro em applyCashbackUsageTx reverte subscription e billing (rollback)', async () => {
    const { user, customer, wallet } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { price: 99.90 });
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: 30.00 },
    });

    jest
      .spyOn(walletService, 'applyCashbackUsageTx')
      .mockRejectedValue(new Error('simulated debit failure'));

    const dto = {
      planId: plan.id,
      vehicleId: vehicle.id,
      paymentMethod: 'PIX',
    } as any;

    await expect(service.confirmSubscription(user as any, dto)).rejects.toThrow();

    // rollback: subscription NÃO criada
    const subs = await prisma.subscription.findMany({
      where: { customerId: customer.id },
    });
    expect(subs).toHaveLength(0);

    // rollback: billing NÃO criado
    const billings = await prisma.billingHistory.findMany({
      where: { customerId: customer.id },
    });
    expect(billings).toHaveLength(0);

    // wallet inalterada (mock rejeitou antes de qualquer debit)
    const unchangedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
    expect(Number(unchangedWallet!.balance)).toBe(30);
  });

  // ─── Cenário 4 — previewSubscription retorna pricing sem chamar Asaas ─────

  it('cenário 4: previewSubscription retorna pricing correto sem criar registros no banco', async () => {
    const { user, customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { price: 99.90 });
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    const dto = { planId: plan.id, vehicleId: vehicle.id, paymentMethod: 'PIX' } as any;
    const preview = await service.previewSubscription(user as any, dto);

    expect(preview.planAmount).toBe(99.90);
    expect(preview.gatewayAmount).toBe(99.90); // sem cashback
    expect(preview.totalCashbackUsed).toBe(0);
    expect(preview.planId).toBe(plan.id);
    expect(preview.vehicleId).toBe(vehicle.id);

    // Nenhum registro criado no banco
    const subs = await prisma.subscription.findMany({ where: { customerId: customer.id } });
    expect(subs).toHaveLength(0);
  });

  // ─── Cenário 5 — Cliente não encontrado → NotFoundException ──────────────

  it('cenário 5: confirmSubscription com user sem perfil de cliente lança NotFoundException', async () => {
    // Cria User sem registro Customer associado
    const user = await createTestUser(prisma, cleanup, 'CUSTOMER');
    const plan = await createTestPlan(prisma, cleanup);

    const dto = { planId: plan.id, vehicleId: 'fake-vehicle-id', paymentMethod: 'PIX' } as any;

    await expect(
      service.confirmSubscription(user as any, dto),
    ).rejects.toThrow('Perfil de cliente não encontrado para este usuário');
  });

  // ─── Cenário 6 — Veículo não encontrado → NotFoundException ──────────────

  it('cenário 6: confirmSubscription com vehicleId inválido lança NotFoundException', async () => {
    const { user } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);

    const dto = { planId: plan.id, vehicleId: 'non-existent-vehicle-id', paymentMethod: 'PIX' } as any;

    await expect(
      service.confirmSubscription(user as any, dto),
    ).rejects.toThrow('Veículo não encontrado para este cliente');
  });

  // ─── Cenário 7 — Plano não encontrado → NotFoundException ────────────────

  it('cenário 7: confirmSubscription com planId inválido lança NotFoundException', async () => {
    const { user, customer } = await createTestCustomer(prisma, cleanup);
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    const dto = { planId: 'non-existent-plan-id', vehicleId: vehicle.id, paymentMethod: 'PIX' } as any;

    await expect(
      service.confirmSubscription(user as any, dto),
    ).rejects.toThrow('Plano não encontrado ou inativo');
  });
});
