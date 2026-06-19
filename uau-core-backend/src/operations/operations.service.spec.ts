import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import {
  TestCleanup,
  createTestCustomer,
  createTestFranchiseUnit,
  createTestPlan,
  createTestSubscription,
  createTestVehicle,
} from '../test/helpers';
import { OperationsService } from './operations.service';

describe('OperationsService', () => {
  let module: TestingModule;
  let service: OperationsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [OperationsService, PrismaService],
    }).compile();

    service = module.get(OperationsService);
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

  // ─── confirmPlateWash ────────────────────────────────────────────────────

  describe('confirmPlateWash — revalidação de assinatura', () => {
    it('cenário 1: confirma lavagem quando assinatura está ACTIVE e expiresAt no futuro', async () => {
      const { customer } = await createTestCustomer(prisma, cleanup);
      const plan = await createTestPlan(prisma, cleanup);
      const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

      const future = new Date();
      future.setDate(future.getDate() + 30);

      await createTestSubscription(prisma, cleanup, customer.id, plan.id, {}, {
        vehicleId: vehicle.id,
        status: 'ACTIVE',
        expiresAt: future,
      });

      const result = await service.confirmPlateWash(vehicle.plate, { unitId: 'unit-test' });
      expect(result.ok).toBe(true);
    });

    it('cenário 2: rejeita e muda Subscription para CANCELLED quando expiresAt está no passado', async () => {
      const { customer } = await createTestCustomer(prisma, cleanup);
      const plan = await createTestPlan(prisma, cleanup);
      const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

      const past = new Date();
      past.setDate(past.getDate() - 1);

      const { subscription } = await createTestSubscription(
        prisma,
        cleanup,
        customer.id,
        plan.id,
        {},
        { vehicleId: vehicle.id, status: 'ACTIVE', expiresAt: past },
      );

      await expect(
        service.confirmPlateWash(vehicle.plate, { unitId: 'unit-test' }),
      ).rejects.toThrow(BadRequestException);

      const updated = await prisma.subscription.findUnique({ where: { id: subscription.id } });
      expect(updated?.status).toBe('CANCELLED');
    });

    it('cenário 3: rejeita quando não há nenhuma assinatura ACTIVE/OVERDUE para o veículo', async () => {
      const { customer } = await createTestCustomer(prisma, cleanup);
      const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

      await expect(
        service.confirmPlateWash(vehicle.plate, { unitId: 'unit-test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cenário 4: rejeita quando assinatura do veículo está CANCELLED', async () => {
      const { customer } = await createTestCustomer(prisma, cleanup);
      const plan = await createTestPlan(prisma, cleanup);
      const vehicle = await createTestVehicle(prisma, cleanup, customer.id);

      await createTestSubscription(prisma, cleanup, customer.id, plan.id, {}, {
        vehicleId: vehicle.id,
        status: 'CANCELLED',
      });

      await expect(
        service.confirmPlateWash(vehicle.plate, { unitId: 'unit-test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getMyAttendances — IDOR ─────────────────────────────────────────────

  describe('getMyAttendances — restrição de acesso para CUSTOMER', () => {
    it('cenário 5: CUSTOMER recebe apenas seus atendimentos mesmo passando userId de outro usuário', async () => {
      const { customer: customerA, user: userA } = await createTestCustomer(prisma, cleanup);
      const { customer: customerB, user: userB } = await createTestCustomer(prisma, cleanup);
      const { unit } = await createTestFranchiseUnit(prisma, cleanup);

      const shift = await prisma.shift.create({
        data: { unitId: unit.id, operatorId: 'system', status: 'OPEN', openedAt: new Date() },
      });
      cleanup.track('shifts', shift.id);

      await prisma.attendance.create({
        data: {
          shiftId: shift.id,
          customerId: customerA.id,
          plate: 'TST0001',
          status: 'COMPLETED',
          type: 'MANUAL',
          completedAt: new Date(),
        },
      });

      // customerB (CUSTOMER) tenta consultar com userId de A — deve receber apenas os seus (vazio)
      const results = await service.getMyAttendances(userA.id, {
        id: userB.id,
        role: 'CUSTOMER',
      });

      expect(results).toHaveLength(0);
    });
  });
});
