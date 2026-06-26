import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TestCleanup, createTestFranchiseUnit, createTestUser } from '../test/helpers';
import { FranchiseUnitsService } from './franchise-units.service';

describe('FranchiseUnitsService — staff', () => {
  let module: TestingModule;
  let service: FranchiseUnitsService;
  let prisma: PrismaService;
  let cleanup: TestCleanup;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [FranchiseUnitsService, PrismaService],
    }).compile();
    service = module.get(FranchiseUnitsService);
    prisma = module.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(() => { cleanup = new TestCleanup(); });

  afterEach(async () => { await cleanup.flush(prisma); });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  // ─── getStaff ────────────────────────────────────────────────────────────

  it('getStaff: lança NotFoundException para unidade inexistente', async () => {
    await expect(service.getStaff('id-inexistente')).rejects.toThrow(NotFoundException);
  });

  it('getStaff: retorna array vazio quando unidade não tem staff', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const result = await service.getStaff(unit.id);
    expect(result).toEqual([]);
  });

  it('getStaff: retorna staff com user incluso', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');
    await prisma.unitStaff.create({ data: { unitId: unit.id, userId: user.id, role: 'OPERATOR' } });

    const result = await service.getStaff(unit.id);
    expect(result).toHaveLength(1);
    expect(result[0].user.id).toBe(user.id);
    expect(result[0].role).toBe('OPERATOR');
  });

  // ─── addStaff ────────────────────────────────────────────────────────────

  it('addStaff: lança NotFoundException para unidade inexistente', async () => {
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');
    await expect(service.addStaff('id-inexistente', { userId: user.id, role: 'OPERATOR' }))
      .rejects.toThrow(NotFoundException);
  });

  it('addStaff: lança NotFoundException para userId inexistente', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    await expect(service.addStaff(unit.id, { userId: 'id-inexistente', role: 'OPERATOR' }))
      .rejects.toThrow(NotFoundException);
  });

  it('addStaff: cria vínculo com sucesso', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');

    const result = await service.addStaff(unit.id, { userId: user.id, role: 'MANAGER' });

    expect(result.unitId).toBe(unit.id);
    expect(result.userId).toBe(user.id);
    expect(result.role).toBe('MANAGER');
    expect(result.isActive).toBe(true);
  });

  it('addStaff: lança ConflictException para vínculo duplicado', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');
    await service.addStaff(unit.id, { userId: user.id, role: 'OPERATOR' });

    await expect(service.addStaff(unit.id, { userId: user.id, role: 'OPERATOR' }))
      .rejects.toThrow(ConflictException);
  });

  it('addStaff: lança ForbiddenException quando FRANCHISE_OWNER acessa unidade alheia', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const owner = await createTestUser(prisma, cleanup, 'FRANCHISE_OWNER');
    const target = await createTestUser(prisma, cleanup, 'OPERATOR');
    // owner.defaultUnitId é null — não é dono de nenhuma unidade

    await expect(service.addStaff(unit.id, { userId: target.id, role: 'OPERATOR' }, owner.id))
      .rejects.toThrow(ForbiddenException);
  });

  // ─── activateStaff ───────────────────────────────────────────────────────

  it('activateStaff: lança NotFoundException para staffId inexistente na unidade', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    await expect(service.activateStaff(unit.id, 'id-inexistente')).rejects.toThrow(NotFoundException);
  });

  it('activateStaff: define isActive = true', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');
    const link = await prisma.unitStaff.create({
      data: { unitId: unit.id, userId: user.id, role: 'OPERATOR', isActive: false },
    });

    const result = await service.activateStaff(unit.id, link.id);
    expect(result.id).toBe(link.id);
    expect(result.isActive).toBe(true);
  });

  // ─── deactivateStaff ─────────────────────────────────────────────────────

  it('deactivateStaff: define isActive = false', async () => {
    const { unit } = await createTestFranchiseUnit(prisma, cleanup);
    const user = await createTestUser(prisma, cleanup, 'OPERATOR');
    const link = await prisma.unitStaff.create({
      data: { unitId: unit.id, userId: user.id, role: 'OPERATOR', isActive: true },
    });

    const result = await service.deactivateStaff(unit.id, link.id);
    expect(result.id).toBe(link.id);
    expect(result.isActive).toBe(false);
  });
});
