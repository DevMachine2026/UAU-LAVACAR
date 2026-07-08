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
  flushTestCleanup,
} from '../test/helpers';
import { CustomerForAsaas, SubscriptionsService } from './subscriptions.service';

function buildMockAsaas() {
  let sequence = 0;
  const nextId = (prefix: string) => `${prefix}_subscription_test_${++sequence}`;

  return {
    findCustomerByCpfCnpj: jest.fn().mockResolvedValue(null),
    createCustomer: jest.fn().mockImplementation(async () => ({ id: nextId('cus') })),
    createSubscription: jest.fn().mockImplementation(async () => ({ id: nextId('sub') })),
    resolveFirstSubscriptionPayment: jest.fn().mockImplementation(async () => ({
      id: nextId('pay'),
      dueDate: '2026-07-10',
      invoiceUrl: null,
      bankSlipUrl: null,
      bankSlipBarCode: null,
    })),
    getPaymentPixQrCode: jest.fn().mockResolvedValue(null),
  };
}

describe('SubscriptionsService.create — conflito de veículo', () => {
  let module: TestingModule;
  let service: SubscriptionsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;
  let asaasService: ReturnType<typeof buildMockAsaas>;

  beforeAll(async () => {
    asaasService = buildMockAsaas();

    module = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        PrismaService,
        { provide: AsaasService, useValue: asaasService },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await flushTestCleanup(cleanup, prisma);
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

    const result = await service.create({
      customerId: customer.id,
      planId: plan.id,
      vehicleId: vehicle.id,
    });

    expect(result.subscription.vehicleId).toBe(vehicle.id);
    expect(result.subscription.status).toBe('PENDING');

    cleanup.track('subscriptions', result.subscription.id);
    cleanup.track('billingHistory', result.billing.id);
  });

  // ─── Cenário 4 — veículo sem nenhuma assinatura prévia não bloqueia ──────

  it('cenário 4: veículo sem assinatura prévia não lança ConflictException e avança para etapa de pagamento', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);
    const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

    const result = await service.create({ customerId: customer.id, planId: plan.id, vehicleId: vehicle.id });

    expect(result.subscription.vehicleId).toBe(vehicle.id);
    expect(result.subscription.status).toBe('PENDING');

    cleanup.track('subscriptions', result.subscription.id);
    cleanup.track('billingHistory', result.billing.id);
  });

  // ─── Cenário 5 — compatibilidade legada: sem vehicleId cria com null ─────

  it('cenário 5: sem vehicleId mantém compatibilidade e cria assinatura com vehicleId null', async () => {
    const { customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup);

    const result = await service.create({ customerId: customer.id, planId: plan.id });

    expect(result.subscription.vehicleId).toBeNull();
    expect(result.subscription.status).toBe('PENDING');
    expect(result.billing.subscriptionId).toBe(result.subscription.id);
    expect(asaasService.createSubscription).toHaveBeenCalled();

    cleanup.track('subscriptions', result.subscription.id);
    cleanup.track('billingHistory', result.billing.id);
  });
});

describe('SubscriptionsService.resolveAsaasData — dedup de cliente Asaas por CPF', () => {
  let module: TestingModule;
  let service: SubscriptionsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;
  let asaasService: {
    findCustomerByCpfCnpj: jest.Mock;
    createCustomer: jest.Mock;
    createPayment: jest.Mock;
    getPaymentPixQrCode: jest.Mock;
  };

  beforeAll(async () => {
    asaasService = {
      findCustomerByCpfCnpj: jest.fn(),
      createCustomer: jest.fn(),
      createPayment: jest.fn(),
      getPaymentPixQrCode: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        PrismaService,
        { provide: AsaasService, useValue: asaasService },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => {
    cleanup = new TestCleanup();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await flushTestCleanup(cleanup, prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  function toCustomerForAsaas(user: { name: string; email: string }, customer: {
    id: string;
    asaasCustomerId: string | null;
    cpf: string | null;
    phone: string | null;
  }): CustomerForAsaas {
    return {
      id: customer.id,
      asaasCustomerId: customer.asaasCustomerId,
      cpf: customer.cpf,
      phone: customer.phone,
      user: { name: user.name, email: user.email },
    };
  }

  // ─── Cenário 1 — cliente já existe no Asaas por CPF: reaproveita e persiste ──

  it('cenário 1: reaproveita cliente Asaas existente por CPF e persiste no Postgres imediatamente, sem chamar createCustomer', async () => {
    const { user, customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { periodicity: 'QUARTERLY' });

    asaasService.findCustomerByCpfCnpj.mockResolvedValue({ id: 'cus_existing_from_asaas' });
    asaasService.createPayment.mockResolvedValue({ id: 'pay_1', dueDate: '2026-07-10' });

    const result = await service.resolveAsaasData(
      toCustomerForAsaas(user, customer),
      { name: plan.name, periodicity: plan.periodicity },
      { paymentMethodId: 'BOLETO', vehicleId: 'vehicle-test-id' },
      99.9,
      99.9,
    );

    expect(asaasService.findCustomerByCpfCnpj).toHaveBeenCalledWith(customer.cpf);
    expect(asaasService.createCustomer).not.toHaveBeenCalled();
    expect(result.asaasCustomerId).toBe('cus_existing_from_asaas');

    const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
    expect(updatedCustomer!.asaasCustomerId).toBe('cus_existing_from_asaas');
  });

  // ─── Cenário 2 — cliente não existe no Asaas: cria normalmente ───────────────

  it('cenário 2: quando busca por CPF não encontra ninguém, chama createCustomer normalmente', async () => {
    const { user, customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { periodicity: 'QUARTERLY' });

    asaasService.findCustomerByCpfCnpj.mockResolvedValue(null);
    asaasService.createCustomer.mockResolvedValue({ id: 'cus_brand_new' });
    asaasService.createPayment.mockResolvedValue({ id: 'pay_2', dueDate: '2026-07-10' });

    const result = await service.resolveAsaasData(
      toCustomerForAsaas(user, customer),
      { name: plan.name, periodicity: plan.periodicity },
      { paymentMethodId: 'BOLETO', vehicleId: 'vehicle-test-id' },
      99.9,
      99.9,
    );

    expect(asaasService.createCustomer).toHaveBeenCalled();
    expect(result.asaasCustomerId).toBe('cus_brand_new');
    expect(result.asaasCustomerIsNew).toBe(true);

    const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
    expect(updatedCustomer!.asaasCustomerId).toBeNull();
  });

  // ─── Cenário 3 — cliente local já tem asaasCustomerId: não busca nem cria ──

  it('cenário 3: se cliente já tem asaasCustomerId, não busca por CPF nem cria cliente Asaas', async () => {
    const { user, customer } = await createTestCustomer(prisma, cleanup, {
      asaasCustomerId: 'cus_already_linked_local',
    });
    const plan = await createTestPlan(prisma, cleanup, { periodicity: 'QUARTERLY' });

    asaasService.createPayment.mockResolvedValue({ id: 'pay_3', dueDate: '2026-07-10' });

    const result = await service.resolveAsaasData(
      toCustomerForAsaas(user, customer),
      { name: plan.name, periodicity: plan.periodicity },
      { paymentMethodId: 'BOLETO', vehicleId: 'vehicle-test-id' },
      99.9,
      99.9,
    );

    expect(asaasService.findCustomerByCpfCnpj).not.toHaveBeenCalled();
    expect(asaasService.createCustomer).not.toHaveBeenCalled();
    expect(result.asaasCustomerId).toBe('cus_already_linked_local');
  });

  // ─── Cenário 4 — cliente Asaas já vinculado em outro customer local ────────

  it('cenário 4: conflito de asaasCustomerId já vinculado a outro customer local falha antes de criar cobrança', async () => {
    await createTestCustomer(prisma, cleanup, {
      asaasCustomerId: 'cus_existing_from_asaas',
    });
    const { user, customer } = await createTestCustomer(prisma, cleanup);
    const plan = await createTestPlan(prisma, cleanup, { periodicity: 'QUARTERLY' });

    asaasService.findCustomerByCpfCnpj.mockResolvedValue({ id: 'cus_existing_from_asaas' });

    await expect(
      service.resolveAsaasData(
        toCustomerForAsaas(user, customer),
        { name: plan.name, periodicity: plan.periodicity },
        { paymentMethodId: 'BOLETO', vehicleId: 'vehicle-test-id' },
        99.9,
        99.9,
      ),
    ).rejects.toThrow('Cliente Asaas já está vinculado a outro cliente local');

    expect(asaasService.createCustomer).not.toHaveBeenCalled();
    expect(asaasService.createPayment).not.toHaveBeenCalled();
  });
});
