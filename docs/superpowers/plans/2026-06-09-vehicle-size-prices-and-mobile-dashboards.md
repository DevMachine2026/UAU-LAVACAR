# Vehicle-Size-Prices + Mobile Dashboard Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar 5 endpoints CRUD de preços-por-porte sob `/plans/:planId/vehicle-size-prices` e 3 endpoints de dashboard mobile (`/franchise-dashboard/partners`, `/partner-dashboard/campaigns`, `/partner-dashboard/customers`), todos filtrados pelo usuário autenticado.

**Architecture:** `PlanVehicleSizePrice` já existe no schema — apenas adicionamos rotas ao módulo `plans`. `Campaign` precisará de `partnerId String?` (migration manual). Os endpoints de dashboard reutilizam o padrão de resolução de identidade já existente em `partner-dashboard.service.ts` (`resolvePartnerId`) e o campo `User.defaultUnitId` para o franchise owner.

**Tech Stack:** NestJS 10, Prisma ORM, PostgreSQL, class-validator, Swagger (`@nestjs/swagger`)

---

## File Map

| Ação | Arquivo |
|------|---------|
| Create | `src/plans/dto/create-vehicle-size-price.dto.ts` |
| Create | `src/plans/dto/update-vehicle-size-price.dto.ts` |
| Modify | `src/plans/plans.controller.ts` |
| Modify | `src/plans/plans.service.ts` |
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/20260609000002_add_partner_id_to_campaigns/migration.sql` |
| Modify | `src/franchise-dashboard/franchise-dashboard.controller.ts` |
| Modify | `src/franchise-dashboard/franchise-dashboard.service.ts` |
| Modify | `src/partner-dashboard/partner-dashboard.controller.ts` |
| Modify | `src/partner-dashboard/partner-dashboard.service.ts` |

---

## Task 1: DTOs para vehicle-size-prices

**Files:**
- Create: `src/plans/dto/create-vehicle-size-price.dto.ts`
- Create: `src/plans/dto/update-vehicle-size-price.dto.ts`

- [ ] **Step 1: Criar create-vehicle-size-price.dto.ts**

```typescript
// src/plans/dto/create-vehicle-size-price.dto.ts
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleSizePriceDto {
  @ApiProperty({ description: 'ID da categoria de tamanho (VehicleSizeCategory)' })
  @IsString()
  @IsNotEmpty()
  sizeCategoryId: string;

  @ApiProperty({ description: 'Preço para este porte', example: 49.90 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

- [ ] **Step 2: Criar update-vehicle-size-price.dto.ts**

```typescript
// src/plans/dto/update-vehicle-size-price.dto.ts
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleSizePriceDto {
  @ApiPropertyOptional({ description: 'Novo preço para este porte', example: 59.90 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/plans/dto/create-vehicle-size-price.dto.ts src/plans/dto/update-vehicle-size-price.dto.ts
git commit -m "feat(plans): add DTOs for vehicle-size-price sub-resource"
```

---

## Task 2: Métodos de vehicle-size-prices no PlansService

**Files:**
- Modify: `src/plans/plans.service.ts`

- [ ] **Step 1: Adicionar imports e 4 métodos ao PlansService**

Substituir o conteúdo completo de `src/plans/plans.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateVehicleSizePriceDto } from './dto/create-vehicle-size-price.dto';
import { UpdateVehicleSizePriceDto } from './dto/update-vehicle-size-price.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.plan.findMany({
      include: {
        availabilities: true,
        vehicleSizePrices: { include: { sizeCategory: true } },
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        availabilities: true,
        vehicleSizePrices: { include: { sizeCategory: true } },
      },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async update(id: string, updateDto: UpdatePlanDto) {
    return this.prisma.plan.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Plano não encontrado');
    });
  }

  async activate(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Plano não encontrado'); });
  }

  async deactivate(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Plano não encontrado'); });
  }

  // ─── Vehicle Size Prices ────────────────────────────────────────────────────

  async findVehicleSizePrices(planId: string) {
    await this.findOne(planId);
    return this.prisma.planVehicleSizePrice.findMany({
      where: { planId },
      include: { sizeCategory: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createVehicleSizePrice(planId: string, dto: CreateVehicleSizePriceDto) {
    await this.findOne(planId);
    return this.prisma.planVehicleSizePrice.create({
      data: { planId, ...dto },
      include: { sizeCategory: true },
    });
  }

  async updateVehicleSizePrice(planId: string, id: string, dto: UpdateVehicleSizePriceDto) {
    await this.findOne(planId);
    return this.prisma.planVehicleSizePrice.update({
      where: { id },
      data: dto,
      include: { sizeCategory: true },
    }).catch(() => { throw new NotFoundException('Preço por porte não encontrado'); });
  }

  async removeVehicleSizePrice(planId: string, id: string) {
    await this.findOne(planId);
    return this.prisma.planVehicleSizePrice.delete({
      where: { id },
    }).catch(() => { throw new NotFoundException('Preço por porte não encontrado'); });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/plans/plans.service.ts
git commit -m "feat(plans): add vehicle-size-price CRUD methods to PlansService"
```

---

## Task 3: Endpoints de vehicle-size-prices no PlansController

**Files:**
- Modify: `src/plans/plans.controller.ts`

- [ ] **Step 1: Substituir conteúdo completo de plans.controller.ts**

```typescript
import { Controller, Get, Post, Body, Param, Patch, Put, Delete } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateVehicleSizePriceDto } from './dto/create-vehicle-size-price.dto';
import { UpdateVehicleSizePriceDto } from './dto/update-vehicle-size-price.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria um novo plano de assinatura' })
  create(@Body() createDto: CreatePlanDto) {
    return this.plansService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os planos' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um plano pelo ID' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza um plano' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePlanDto) {
    return this.plansService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ativa um plano' })
  activate(@Param('id') id: string) {
    return this.plansService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativa um plano' })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }

  // ─── Vehicle Size Prices ──────────────────────────────────────────────────

  @Get(':planId/vehicle-size-prices')
  @ApiOperation({ summary: 'Lista preços por porte de veículo de um plano' })
  findVehicleSizePrices(@Param('planId') planId: string) {
    return this.plansService.findVehicleSizePrices(planId);
  }

  @Post(':planId/vehicle-size-prices')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria preço por porte de veículo para um plano' })
  createVehicleSizePrice(
    @Param('planId') planId: string,
    @Body() dto: CreateVehicleSizePriceDto,
  ) {
    return this.plansService.createVehicleSizePrice(planId, dto);
  }

  @Put(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Substitui preço por porte de veículo' })
  updateVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleSizePriceDto,
  ) {
    return this.plansService.updateVehicleSizePrice(planId, id, dto);
  }

  @Patch(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza parcialmente preço por porte de veículo' })
  patchVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleSizePriceDto,
  ) {
    return this.plansService.updateVehicleSizePrice(planId, id, dto);
  }

  @Delete(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove preço por porte de veículo' })
  removeVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.removeVehicleSizePrice(planId, id);
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-core-backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/plans/plans.controller.ts
git commit -m "feat(plans): add CRUD endpoints for vehicle-size-prices sub-resource"
```

---

## Task 4: Adicionar partnerId ao Campaign (schema + migration)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260609000002_add_partner_id_to_campaigns/migration.sql`

- [ ] **Step 1: Atualizar schema.prisma**

No modelo `Campaign`, adicionar campo e relação logo antes de `createdAt`:

```prisma
model Campaign {
  id          String    @id @default(cuid())
  name        String
  description String?
  isActive    Boolean   @default(true)
  startAt     DateTime?
  endAt       DateTime?
  partnerId   String?

  partner   Partner?  @relation(fields: [partnerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("campaigns")
}
```

No modelo `Partner`, adicionar a relação inversa no bloco de relações existente:

```prisma
  campaigns            Campaign[]
```

(inserir após `partnerTransactions PartnerTransaction[]`)

- [ ] **Step 2: Criar a migration SQL manualmente**

Criar o arquivo `prisma/migrations/20260609000002_add_partner_id_to_campaigns/migration.sql` com o conteúdo:

```sql
-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "partnerId" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 3: Marcar migration como aplicada e regenerar o cliente Prisma**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-core-backend
# Aplica a migration no banco (usa DIRECT_URL para DDL)
npx prisma migrate deploy
# Regenera o cliente Prisma com os novos tipos
npx prisma generate
```

Expected: "All migrations have been successfully applied."

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260609000002_add_partner_id_to_campaigns/
git commit -m "feat(campaigns): add optional partnerId FK to Campaign model"
```

---

## Task 5: Endpoint GET /franchise-dashboard/partners

**Files:**
- Modify: `src/franchise-dashboard/franchise-dashboard.controller.ts`
- Modify: `src/franchise-dashboard/franchise-dashboard.service.ts`

- [ ] **Step 1: Adicionar endpoint ao controller**

Substituir conteúdo de `src/franchise-dashboard/franchise-dashboard.controller.ts`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { FranchiseDashboardService } from './franchise-dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('franchise-dashboard')
@ApiBearerAuth()
@Controller('franchise-dashboard')
export class FranchiseDashboardController {
  constructor(private readonly svc: FranchiseDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Overview da franquia' })
  getOverview(@Query('unitId') unitId?: string) { return this.svc.getOverview(unitId); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'KPIs financeiros da franquia' })
  getFinancial(@Query('unitId') unitId?: string) { return this.svc.getFinancial(unitId); }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'KPIs operacionais da franquia' })
  getOperations(@Query('unitId') unitId?: string) { return this.svc.getOperations(unitId); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Alertas da franquia' })
  getAlerts(@Query('unitId') unitId?: string) { return this.svc.getAlerts(unitId); }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'ANPR da franquia' })
  getAnpr(@Query('unitId') unitId?: string) { return this.svc.getAnpr(unitId); }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Clientes da franquia com filtros' })
  getCustomers(
    @Query('unitId') unitId?: string,
    @Query('name') name?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getCustomers({ unitId, name, status });
  }

  @Get('partners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Parceiros associados à franquia do usuário autenticado' })
  getPartners(@CurrentUser() user: User) {
    return this.svc.getPartners(user);
  }
}
```

- [ ] **Step 2: Adicionar método getPartners ao service**

Substituir conteúdo de `src/franchise-dashboard/franchise-dashboard.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FranchiseDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(unitId?: string) {
    const unitWhere = unitId ? { id: unitId } : {};
    const units = await this.prisma.franchiseUnit.findMany({
      where: { ...unitWhere, isActive: true },
      select: { id: true },
    });

    const customerWhere = unitId ? { where: { user: { defaultUnitId: unitId } } } : undefined;
    const [totalCustomers, activeSubscriptions, overdueSubscriptions] = await Promise.all([
      this.prisma.customer.count(customerWhere),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'OVERDUE' } }),
    ]);

    return {
      totalUnits: units.length,
      totalCustomers,
      activeSubscriptions,
      overdueSubscriptions,
    };
  }

  async getFinancial(unitId?: string) {
    const ledgerWhere = unitId ? { unitId } : {};
    const [billingAgg, walletAgg, partnerAgg] = await Promise.all([
      this.prisma.billingHistory.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'DEBIT', origin: 'SUBSCRIPTION' }, _sum: { amount: true } }),
      this.prisma.financialLedger.aggregate({ where: { ...ledgerWhere, type: 'CREDIT', origin: 'PARTNER_COMMISSION' }, _sum: { amount: true } }),
    ]);

    return {
      estimatedFranchiseRevenue: Number(billingAgg._sum.amount ?? 0) * 0.6,
      totalGatewayAmount: Number(billingAgg._sum.amount ?? 0),
      totalCashbackUsedInSubscriptions: Number(walletAgg._sum.amount ?? 0),
      totalPartnerUauCommission: Number(partnerAgg._sum.amount ?? 0),
    };
  }

  async getOperations(unitId?: string) {
    const shiftWhere = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openShifts, planToday, avulsoToday] = await Promise.all([
      this.prisma.shift.count({ where: { ...shiftWhere, status: 'OPEN' } }),
      this.prisma.attendance.count({
        where: { status: 'COMPLETED', type: 'MANUAL', createdAt: { gte: today } },
      }),
      this.prisma.attendance.count({
        where: { status: 'COMPLETED', createdAt: { gte: today } },
      }),
    ]);

    return {
      openShifts,
      totalAttendancesToday: planToday + avulsoToday,
      totalPlanAttendancesToday: planToday,
      totalAvulsoAttendancesToday: avulsoToday,
    };
  }

  async getAlerts(unitId?: string) {
    const [overdueCount] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'OVERDUE' } }),
    ]);

    const alerts: string[] = [];
    if (overdueCount > 0) alerts.push(`${overdueCount} assinatura(s) em atraso`);
    return alerts;
  }

  async getAnpr(unitId?: string) {
    const anprWhere = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, authorized, blocked] = await Promise.all([
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today } } }),
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today }, status: 'AUTHORIZED' } }),
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today }, status: 'BLOCKED' } }),
    ]);
    return { totalEvents: total, authorized, blocked };
  }

  async getCustomers(filters?: { unitId?: string; name?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.unitId || filters?.status || filters?.name) {
      where.user = {
        ...(filters.unitId ? { defaultUnitId: filters.unitId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
      };
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, defaultUnit: { select: { id: true, name: true } } } },
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getPartners(user: User) {
    // SUPER_ADMIN vê todos; FRANCHISE_OWNER vê somente os parceiros da sua unidade padrão
    const where =
      user.role === UserRole.FRANCHISE_OWNER && user.defaultUnitId
        ? { unitId: user.defaultUnitId, isActive: true }
        : { isActive: true };

    return this.prisma.partner.findMany({
      where,
      include: {
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
```

- [ ] **Step 3: Verificar compilação**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-core-backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/franchise-dashboard/franchise-dashboard.controller.ts src/franchise-dashboard/franchise-dashboard.service.ts
git commit -m "feat(franchise-dashboard): add GET /partners endpoint filtered by authenticated user"
```

---

## Task 6: Endpoints GET /partner-dashboard/campaigns e /customers

**Files:**
- Modify: `src/partner-dashboard/partner-dashboard.controller.ts`
- Modify: `src/partner-dashboard/partner-dashboard.service.ts`

> **Pré-requisito:** Task 4 concluída (migration com `partnerId` aplicada e `prisma generate` rodado). Sem isso os tipos Prisma não incluem `campaign.partnerId`.

- [ ] **Step 1: Atualizar partner-dashboard.controller.ts**

```typescript
import { Controller, Get } from '@nestjs/common';
import { PartnerDashboardService } from './partner-dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('partner-dashboard')
@ApiBearerAuth()
@Controller('partner-dashboard')
export class PartnerDashboardController {
  constructor(private readonly svc: PartnerDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Overview do portal parceiro' })
  getOverview(@CurrentUser() user: User) { return this.svc.getOverview(user); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'KPIs financeiros do parceiro' })
  getFinancial(@CurrentUser() user: User) { return this.svc.getFinancial(user); }

  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Últimas transações do parceiro' })
  getTransactions(@CurrentUser() user: User) { return this.svc.getTransactions(user); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Alertas do parceiro' })
  getAlerts(@CurrentUser() user: User) { return this.svc.getAlerts(user); }

  @Get('campaigns')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Campanhas ativas do parceiro autenticado' })
  getCampaigns(@CurrentUser() user: User) { return this.svc.getCampaigns(user); }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Clientes que transacionaram com o parceiro autenticado' })
  getCustomers(@CurrentUser() user: User) { return this.svc.getCustomers(user); }
}
```

- [ ] **Step 2: Atualizar partner-dashboard.service.ts**

```typescript
import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerDashboardService {
  constructor(private prisma: PrismaService) {}

  private async resolvePartnerId(user: User): Promise<string | null> {
    if (user.role !== UserRole.PARTNER) return null;
    const partner = await this.prisma.partner.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true },
    });
    if (!partner) throw new ForbiddenException('Parceiro não encontrado para este usuário');
    return partner.id;
  }

  async getOverview(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    const [activePartners, totalTransactions, customersServed] = await Promise.all([
      this.prisma.partner.count({ where: { isActive: true, ...partnerFilter } }),
      this.prisma.financialLedger.count({ where: { origin: 'PARTNER_TRANSACTION', ...partnerFilter } }),
      this.prisma.partnerTransaction.count({ where: partnerId ? { partnerId } : {} }),
    ]);

    return {
      activePartners,
      totalTransactions,
      totalCustomersServed: customersServed,
      averageTicket: 0,
      totalGrossSales: 0,
      totalCashbackUsed: 0,
    };
  }

  async getFinancial(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    const [ledgerAgg, txAgg] = await Promise.all([
      this.prisma.financialLedger.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'CREDIT', ...partnerFilter },
        _sum: { amount: true },
      }),
      this.prisma.partnerTransaction.aggregate({
        where: partnerId ? { partnerId } : {},
        _sum: { cashbackUsed: true },
      }),
    ]);

    return {
      grossSales: 0,
      gatewayAmount: 0,
      cashbackAcceptedAsDiscount: Number(txAgg._sum.cashbackUsed ?? 0),
      cashbackGenerated: 0,
      uauCommissionAmount: Number(ledgerAgg._sum.amount ?? 0),
    };
  }

  async getTransactions(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    return this.prisma.financialLedger.findMany({
      where: { origin: 'PARTNER_TRANSACTION', ...partnerFilter },
      include: { partner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlerts(user: User) {
    await this.resolvePartnerId(user);
    const alerts: string[] = [];
    return alerts;
  }

  async getCampaigns(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const now = new Date();

    return this.prisma.campaign.findMany({
      where: {
        ...(partnerId ? { partnerId } : {}),
        isActive: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomers(user: User) {
    const partnerId = await this.resolvePartnerId(user);

    // Busca IDs distintos de clientes que transacionaram com este parceiro
    const txRows = await this.prisma.partnerTransaction.findMany({
      where: partnerId ? { partnerId } : {},
      select: { customerId: true },
      distinct: ['customerId'],
    });

    const customerIds = txRows.map((r) => r.customerId);

    return this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
```

- [ ] **Step 3: Verificar compilação**

```bash
cd /mnt/hd/UAU-LAVACAR/uau-core-backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/partner-dashboard/partner-dashboard.controller.ts src/partner-dashboard/partner-dashboard.service.ts
git commit -m "feat(partner-dashboard): add campaigns and customers endpoints filtered by authenticated partner"
```

---

## Self-Review

### Spec Coverage

| Requisito | Task que implementa |
|-----------|---------------------|
| GET `/plans/:planId/vehicle-size-prices` | Task 3 |
| POST `/plans/:planId/vehicle-size-prices` | Task 3 |
| PUT `/plans/:planId/vehicle-size-prices/:id` | Task 3 |
| PATCH `/plans/:planId/vehicle-size-prices/:id` | Task 3 |
| DELETE `/plans/:planId/vehicle-size-prices/:id` | Task 3 |
| Model `PlanVehicleSizePrice` no schema | Já existe — sem migration necessária |
| GET `/franchise-dashboard/partners` | Task 5 |
| GET `/partner-dashboard/campaigns` | Task 6 |
| GET `/partner-dashboard/customers` | Task 6 |
| Filtro pelo usuário autenticado em dashboards | Tasks 5 e 6 |
| `partnerId` na `Campaign` (pré-req para `/campaigns`) | Task 4 |

### Placeholder Scan

Nenhum "TBD", "TODO" ou step sem código encontrado.

### Type Consistency

- `CreateVehicleSizePriceDto.sizeCategoryId` → usado em `plans.service.ts` como `{ planId, ...dto }` → campo `sizeCategoryId` corresponde ao modelo Prisma `PlanVehicleSizePrice.sizeCategoryId`. ✓
- `UpdateVehicleSizePriceDto` com apenas `price?` e `isActive?` → service usa `data: dto` → não tenta setar `sizeCategoryId` (campo imutável após criação). ✓
- `resolvePartnerId(user)` retorna `string | null` → usada como `partnerId ? { partnerId } : {}` em todos os métodos do partner-dashboard. ✓
- `user.defaultUnitId` em `getPartners` — campo existe no modelo `User` do schema Prisma. ✓
- `campaign.partnerId` — adicionado na Task 4; Tasks 5+6 dependem da migration e do `prisma generate` da Task 4. Dependência documentada na Task 6. ✓
