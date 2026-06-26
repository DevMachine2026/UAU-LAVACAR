# Unit Staff API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 3 endpoints de gestão de equipe por unidade (`GET/POST/PATCH staff`) no backend NestJS, eliminando a última lacuna de integração entre frontend e backend.

**Architecture:** Tudo dentro do módulo `franchise-units` já existente — um DTO novo, 4 métodos no service, 4 rotas no controller. Nenhuma migration Prisma (model `UnitStaff` e tabela já existem). Testes de integração com PrismaService real, seguindo o padrão dos specs existentes.

**Tech Stack:** NestJS, Prisma ORM, class-validator, Jest + ts-jest, banco Neon (test)

## Global Constraints

- Nunca criar novos módulos NestJS — usar apenas `franchise-units` existente
- Todos os endpoints exigem `@Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)` — nenhum acesso público ou de OPERATOR/CUSTOMER
- `FRANCHISE_OWNER` só gerencia staff da sua própria unidade (`assertFranchiseOwnerOwnsUnit` já existe no service)
- Reutilizar `TestCleanup` + factories de `src/test/helpers.ts` nos testes — nunca deletar dados manualmente
- Rodar testes com: `cd uau-core-backend && npm test -- --testPathPattern=franchise-units`
- `UnitStaff.role` é `String` no Prisma (não enum do sistema) — valores válidos: `"MANAGER"` e `"OPERATOR"`

---

### Task 1: DTO `AddUnitStaffDto`

**Files:**
- Create: `uau-core-backend/src/franchise-units/dto/add-unit-staff.dto.ts`

**Interfaces:**
- Produces: `AddUnitStaffDto { userId: string; role: string }` — usado nas Tasks 2 e 3

- [ ] **Step 1: Criar o arquivo DTO**

```typescript
// uau-core-backend/src/franchise-units/dto/add-unit-staff.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AddUnitStaffDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(['MANAGER', 'OPERATOR'])
  role: string;
}
```

- [ ] **Step 2: Verificar que TypeScript compila sem erros**

```bash
cd uau-core-backend && npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git -C .. add uau-core-backend/src/franchise-units/dto/add-unit-staff.dto.ts
git -C .. commit -m "feat: add AddUnitStaffDto"
```

---

### Task 2: Métodos de serviço no `FranchiseUnitsService`

**Files:**
- Modify: `uau-core-backend/src/franchise-units/franchise-units.service.ts`
- Create: `uau-core-backend/src/franchise-units/franchise-units.service.spec.ts`

**Interfaces:**
- Consumes: `AddUnitStaffDto` (Task 1), `assertFranchiseOwnerOwnsUnit(userId, unitId)` já existente no service
- Produces:
  - `getStaff(unitId: string, actorId?: string): Promise<UnitStaff[]>` — retorna staff com `user` e `unit` inclusos
  - `addStaff(unitId: string, dto: AddUnitStaffDto, actorId?: string): Promise<UnitStaff>`
  - `activateStaff(unitId: string, staffId: string, actorId?: string): Promise<{ id: string; isActive: boolean }>`
  - `deactivateStaff(unitId: string, staffId: string, actorId?: string): Promise<{ id: string; isActive: boolean }>`

- [ ] **Step 1: Criar o arquivo de teste com os casos de falha**

```typescript
// uau-core-backend/src/franchise-units/franchise-units.service.spec.ts
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
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
cd uau-core-backend && npm test -- --testPathPattern=franchise-units.service
```

Esperado: todos os testes falhando com erros de "method not found" ou "is not a function".

- [ ] **Step 3: Implementar os 4 métodos no service**

Adicionar ao final da classe `FranchiseUnitsService` (antes do método privado `assertFranchiseOwnerOwnsUnit`), em [franchise-units.service.ts](uau-core-backend/src/franchise-units/franchise-units.service.ts):

```typescript
  async getStaff(unitId: string, actorId?: string) {
    const unit = await this.prisma.franchiseUnit.findUnique({ where: { id: unitId }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    return this.prisma.unitStaff.findMany({
      where: { unitId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, status: true } },
        unit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addStaff(unitId: string, dto: AddUnitStaffDto, actorId?: string) {
    const unit = await this.prisma.franchiseUnit.findUnique({ where: { id: unitId }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    return this.prisma.unitStaff.create({
      data: { unitId, userId: dto.userId, role: dto.role },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, status: true } },
        unit: { select: { id: true, name: true } },
      },
    }).catch((err: { code?: string }) => {
      if (err?.code === 'P2002') throw new ConflictException('Usuário já vinculado a esta unidade');
      throw err;
    });
  }

  async activateStaff(unitId: string, staffId: string, actorId?: string) {
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    const link = await this.prisma.unitStaff.findFirst({ where: { id: staffId, unitId } });
    if (!link) throw new NotFoundException('Vínculo de staff não encontrado');
    return this.prisma.unitStaff.update({
      where: { id: staffId },
      data: { isActive: true },
      select: { id: true, isActive: true },
    });
  }

  async deactivateStaff(unitId: string, staffId: string, actorId?: string) {
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    const link = await this.prisma.unitStaff.findFirst({ where: { id: staffId, unitId } });
    if (!link) throw new NotFoundException('Vínculo de staff não encontrado');
    return this.prisma.unitStaff.update({
      where: { id: staffId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
```

Também adicionar `ConflictException` ao import do `@nestjs/common` no topo do service, e importar `AddUnitStaffDto`:

```typescript
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddUnitStaffDto } from './dto/add-unit-staff.dto';
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
cd uau-core-backend && npm test -- --testPathPattern=franchise-units.service
```

Esperado: todos os testes `PASS`. Se `ConflictException` não estiver importado, o compilador vai reclamar — corrigir o import.

- [ ] **Step 5: Verificar typecheck**

```bash
cd uau-core-backend && npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git -C .. add uau-core-backend/src/franchise-units/franchise-units.service.ts \
               uau-core-backend/src/franchise-units/franchise-units.service.spec.ts
git -C .. commit -m "feat: implement unit staff service methods (get/add/activate/deactivate)"
```

---

### Task 3: Rotas no `FranchiseUnitsController`

**Files:**
- Modify: `uau-core-backend/src/franchise-units/franchise-units.controller.ts`

**Interfaces:**
- Consumes: `getStaff`, `addStaff`, `activateStaff`, `deactivateStaff` (Task 2), `AddUnitStaffDto` (Task 1)
- Produces: 4 rotas HTTP prontas para consumo do frontend

- [ ] **Step 1: Adicionar as 4 rotas ao controller**

Adicionar ao final da classe `FranchiseUnitsController`, antes do fechamento `}`, em [franchise-units.controller.ts](uau-core-backend/src/franchise-units/franchise-units.controller.ts):

```typescript
  @Get(':id/staff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista a equipe de uma unidade' })
  getStaff(@Param('id') id: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.getStaff(id, actorId);
  }

  @Post(':id/staff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Vincula um usuário como staff da unidade' })
  addStaff(@Param('id') id: string, @Body() dto: AddUnitStaffDto, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.addStaff(id, dto, actorId);
  }

  @Patch(':id/staff/:staffId/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Ativa um vínculo de staff' })
  activateStaff(@Param('id') id: string, @Param('staffId') staffId: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.activateStaff(id, staffId, actorId);
  }

  @Patch(':id/staff/:staffId/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Desativa um vínculo de staff' })
  deactivateStaff(@Param('id') id: string, @Param('staffId') staffId: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.deactivateStaff(id, staffId, actorId);
  }
```

Adicionar `AddUnitStaffDto` ao import do controller:

```typescript
import { AddUnitStaffDto } from './dto/add-unit-staff.dto';
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd uau-core-backend && npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Rodar todos os testes do módulo**

```bash
cd uau-core-backend && npm test -- --testPathPattern=franchise-units
```

Esperado: todos `PASS`.

- [ ] **Step 4: Commit**

```bash
git -C .. add uau-core-backend/src/franchise-units/franchise-units.controller.ts
git -C .. commit -m "feat: add unit staff endpoints (GET/POST/PATCH) to franchise-units controller"
```

---

## Verificação final

Após os 3 tasks, rodar a suite completa para garantir que não há regressões:

```bash
cd uau-core-backend && npm test
```

Esperado: todos os testes passando.
