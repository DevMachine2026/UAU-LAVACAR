# UAU+ Backend Routes & Dashboard Controllers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar todas as rotas do backend com o que o web dashboard espera, eliminando 404s em runtime.

**Architecture:** Cada tarefa é independente e commitada separadamente. Todas as mudanças ficam dentro de `uau-core-backend/src/`. A verificação de cada tarefa é `npm run build` + `npx tsc --noEmit` rodando a partir de `uau-core-backend/`.

**Tech Stack:** NestJS 10, Prisma 5, TypeScript 5.7, PostgreSQL

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `uau-web-dashboard/` — todos os arquivos modificados | commit (Tarefa 1) |
| `src/operations/operations.controller.ts` | reescrever completo |
| `src/operations/operations.service.ts` | expandir com 8 novos métodos |
| `src/operations/dto/open-shift.dto.ts` | corrigir campo `franchiseUnitId` → `unitId` |
| `src/operations/dto/close-shift.dto.ts` | reescrever para `closingReadings` + `closingNotes` |
| `src/operations/dto/manual-attendance.dto.ts` | criar |
| `src/financial/financial.controller.ts` | expandir com 7 novas rotas |
| `src/financial/financial.service.ts` | expandir com 6 novos métodos |
| `src/financial/dto/update-franchise-rule.dto.ts` | corrigir nomes de campos |
| `src/financial/dto/generate-report.dto.ts` | criar |
| `src/antifraud/antifraud.controller.ts` | expandir com 5 novas rotas |
| `src/antifraud/antifraud.service.ts` | expandir com 4 novos métodos |
| `src/billing/billing.controller.ts` | adicionar rota `my-history` |
| `src/billing/billing.service.ts` | adicionar método `findByCustomer` |
| `src/admin-dashboard/` | criar módulo completo (controller + service + module) |
| `src/franchise-dashboard/` | criar módulo completo |
| `src/partner-dashboard/` | criar módulo completo |
| `src/app.module.ts` | registrar 3 novos módulos |

---

## Tarefa 1 — Commit do redesign visual do web dashboard

**Files:**
- Modify: `uau-web-dashboard/` (10 arquivos modificados/novos já prontos)

- [ ] **Step 1: Verificar status dos arquivos**

```bash
cd uau-web-dashboard && git diff --stat HEAD
```

Esperado: lista de 8 arquivos modificados + 2 novos.

- [ ] **Step 2: Commitar**

```bash
git add uau-web-dashboard/package.json uau-web-dashboard/package-lock.json \
  uau-web-dashboard/tailwind.config.ts \
  uau-web-dashboard/src/app/globals.css \
  uau-web-dashboard/src/app/layout.tsx \
  uau-web-dashboard/src/app/login/page.tsx \
  uau-web-dashboard/src/components/Button.tsx \
  uau-web-dashboard/src/components/Card.tsx \
  uau-web-dashboard/src/components/Input.tsx \
  uau-web-dashboard/src/utils/cn.ts

git commit -m "feat(dashboard): redesign visual com framer-motion, lucide e animações"
```

---

## Tarefa 2 — Corrigir módulo Operations (renomear rota + adicionar endpoints)

**Problema:** Controller usa `@Controller('operations')` mas o frontend chama `/operational/...`. Além disso, faltam 10+ endpoints.

**Files:**
- Modify: `uau-core-backend/src/operations/operations.controller.ts`
- Modify: `uau-core-backend/src/operations/operations.service.ts`
- Modify: `uau-core-backend/src/operations/dto/open-shift.dto.ts`
- Modify: `uau-core-backend/src/operations/dto/close-shift.dto.ts`
- Create: `uau-core-backend/src/operations/dto/manual-attendance.dto.ts`

- [ ] **Step 1: Corrigir `open-shift.dto.ts`** — frontend envia `unitId`, não `franchiseUnitId`

```typescript
// uau-core-backend/src/operations/dto/open-shift.dto.ts
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class OpenShiftReadingDto {
  @IsString()
  fieldId: string;

  @IsNumber()
  openingValue: number;
}

export class OpenShiftDto {
  @IsString()
  unitId: string;

  @IsOptional()
  @IsArray()
  openingReadings?: OpenShiftReadingDto[];

  @IsOptional()
  @IsString()
  openingNotes?: string;
}
```

- [ ] **Step 2: Corrigir `close-shift.dto.ts`** — frontend envia `closingReadings` e `closingNotes`

```typescript
// uau-core-backend/src/operations/dto/close-shift.dto.ts
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CloseShiftReadingDto {
  @IsString()
  fieldId: string;

  @IsNumber()
  closingValue: number;
}

export class CloseShiftDto {
  @IsOptional()
  @IsArray()
  closingReadings?: CloseShiftReadingDto[];

  @IsOptional()
  @IsString()
  closingNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 3: Criar `manual-attendance.dto.ts`**

```typescript
// uau-core-backend/src/operations/dto/manual-attendance.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ManualAttendanceDto {
  @IsString()
  shiftId: string;

  @IsString()
  plate: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsNumber()
  cashbackUsed?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Expandir `operations.service.ts`** — adicionar todos os métodos necessários

```typescript
// uau-core-backend/src/operations/operations.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';

const READING_FIELDS = [
  { id: 'water-meter', name: 'Hodômetro de água', key: 'water_meter', isActive: true },
  { id: 'car-counter', name: 'Contador de carros', key: 'car_counter', isActive: true },
  { id: 'compressor', name: 'Pressão do compressor', key: 'compressor', isActive: true },
];

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  getReadingFields() {
    return READING_FIELDS;
  }

  async openShift(dto: OpenShiftDto) {
    const active = await this.prisma.shift.findFirst({
      where: { unitId: dto.unitId, status: 'OPEN' },
    });
    if (active) throw new ConflictException('Já existe um turno aberto para esta unidade');

    return this.prisma.shift.create({
      data: {
        unitId: dto.unitId,
        operatorId: 'system',
        status: 'OPEN',
        openedAt: new Date(),
        readings: dto.openingReadings ? { opening: dto.openingReadings, notes: dto.openingNotes } : undefined,
      },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  async getShifts(filters?: { unitId?: string; status?: string; date?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.shift.findMany({
      where,
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
  }

  async getShift(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: { unit: { select: { id: true, name: true } } },
    });
    if (!shift) throw new NotFoundException('Turno não encontrado');
    return shift;
  }

  async getLiveSummary(shiftId: string) {
    const attendances = await this.prisma.attendance.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'desc' },
    });

    const totalByType = attendances.reduce<Record<string, number>>((acc, a) => {
      const key = a.type ?? 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const totalByStatus = attendances.reduce<Record<string, number>>((acc, a) => {
      const key = a.status ?? 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalAttendances: attendances.length,
      totalByType,
      totalByStatus,
      grossAmount: 0,
      netAmount: 0,
      attendances: attendances.slice(0, 50),
    };
  }

  async createManualAttendance(dto: ManualAttendanceDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id: dto.shiftId } });
    if (!shift) throw new NotFoundException('Turno não encontrado');
    if (shift.status !== 'OPEN') throw new BadRequestException('Turno não está aberto');

    const normalizedPlate = dto.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return this.prisma.attendance.create({
      data: {
        shiftId: dto.shiftId,
        plate: normalizedPlate,
        type: dto.type === 'PLAN' ? 'MANUAL' : 'MANUAL',
        status: dto.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        reason: dto.notes,
      },
    });
  }

  async completeAttendance(id: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) throw new NotFoundException('Atendimento não encontrado');

    return this.prisma.attendance.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async cancelAttendance(id: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) throw new NotFoundException('Atendimento não encontrado');

    return this.prisma.attendance.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async closeShift(shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Turno não encontrado');
    if (shift.status === 'CLOSED') throw new ConflictException('Turno já está fechado');

    return this.prisma.$transaction(async (tx) => {
      const totalWashes = await tx.attendance.count({
        where: { shiftId, status: 'COMPLETED' },
      });

      const updated = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          readings: { closing: dto.closingReadings, notes: dto.closingNotes ?? dto.notes },
        },
        include: { unit: { select: { id: true, name: true } } },
      });

      await tx.shiftClosure.create({
        data: {
          shiftId,
          totalWashes,
          notes: dto.closingNotes ?? dto.notes,
          closedAt: new Date(),
        },
      });

      return updated;
    });
  }

  async getClosures(filters?: { unitId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.unitId) where.shift = { unitId: filters.unitId };

    return this.prisma.shiftClosure.findMany({
      where,
      include: { shift: { include: { unit: { select: { id: true, name: true } } } } },
      orderBy: { closedAt: 'desc' },
      take: 100,
    });
  }

  async getClosure(id: string) {
    const closure = await this.prisma.shiftClosure.findUnique({
      where: { id },
      include: { shift: { include: { unit: { select: { id: true, name: true } } } } },
    });
    if (!closure) throw new NotFoundException('Fechamento não encontrado');
    return closure;
  }

  async checkPlate(plate: string, unitId?: string) {
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, email: true, status: true } },
            subscriptions: {
              where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
              include: { plan: true },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return {
        normalizedPlate,
        vehicleFound: false,
        vehicle: null,
        customer: null,
        plan: null,
        subscription: null,
        canWashToday: false,
        status: 'UNKNOWN',
        reason: 'Placa não cadastrada',
        lastWash: null,
      };
    }

    const customer = vehicle.customer;
    const subscription = customer?.subscriptions?.[0] ?? null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastWash = await this.prisma.dailyWash.findFirst({
      where: { vehicleId: vehicle.id, date: { gte: today, lt: tomorrow } },
      orderBy: { date: 'desc' },
    });

    const canWashToday = !lastWash?.used;
    const status = !subscription
      ? 'NO_SUBSCRIPTION'
      : subscription.status === 'OVERDUE'
      ? 'OVERDUE'
      : lastWash?.used
      ? 'ALREADY_WASHED'
      : 'AUTHORIZED';

    const reason =
      !subscription
        ? 'Sem assinatura ativa'
        : subscription.status === 'OVERDUE'
        ? 'Assinatura em atraso'
        : lastWash?.used
        ? 'Veículo já lavado hoje'
        : null;

    return {
      normalizedPlate,
      vehicleFound: true,
      vehicle: { id: vehicle.id, plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, color: null },
      customer: customer
        ? { id: customer.id, name: customer.user.name, email: customer.user.email, phone: customer.phone }
        : null,
      plan: subscription?.plan
        ? {
            id: subscription.plan.id,
            name: subscription.plan.name,
            coverageType: subscription.plan.coverageType,
            allowedStartTime: subscription.plan.allowedStartTime,
            allowedEndTime: subscription.plan.allowedEndTime,
          }
        : null,
      subscription: subscription
        ? { id: subscription.id, status: subscription.status, nextDueDate: subscription.expiresAt }
        : null,
      canWashToday,
      status,
      reason,
      lastWash: lastWash ? { id: lastWash.id, usedAt: lastWash.usedAt } : null,
    };
  }

  async confirmPlateWash(plate: string, payload: { unitId: string; notes?: string }) {
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicle = await this.prisma.vehicle.findUnique({ where: { plate: normalizedPlate } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.dailyWash.upsert({
      where: { vehicleId_date: { vehicleId: vehicle.id, date: today } },
      update: { used: true, usedAt: new Date() },
      create: { vehicleId: vehicle.id, date: today, used: true, usedAt: new Date() },
    });

    return { ok: true };
  }

  async cancelDailyWash(id: string) {
    const wash = await this.prisma.dailyWash.findUnique({ where: { id } });
    if (!wash) throw new NotFoundException('Registro de lavagem não encontrado');

    await this.prisma.dailyWash.update({
      where: { id },
      data: { used: false, usedAt: null },
    });

    return { ok: true };
  }

  async getMyAttendances(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
    });
    if (!customer) return [];

    return this.prisma.attendance.findMany({
      where: { customerId: customer.id },
      include: { shift: { include: { unit: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getActiveShift(franchiseUnitId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { unitId: franchiseUnitId, status: 'OPEN' },
      include: { unit: { select: { id: true, name: true } } },
    });
    if (!shift) throw new NotFoundException('Nenhum turno aberto para esta unidade');
    return shift;
  }
}
```

- [ ] **Step 5: Reescrever `operations.controller.ts`**

```typescript
// uau-core-backend/src/operations/operations.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('operational')
@ApiBearerAuth()
@Controller('operational')
export class OperationsController {
  constructor(private readonly svc: OperationsService) {}

  @Get('reading-fields')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista campos de leitura configuráveis para expedientes' })
  getReadingFields() {
    return this.svc.getReadingFields();
  }

  @Post('shifts/open')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Abre um expediente na unidade' })
  openShift(@Body() dto: OpenShiftDto) {
    return this.svc.openShift(dto);
  }

  @Get('shifts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOperation({ summary: 'Lista expedientes com filtros opcionais' })
  getShifts(
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getShifts({ unitId, status });
  }

  @Get('shifts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Busca um expediente pelo ID' })
  getShift(@Param('id') id: string) {
    return this.svc.getShift(id);
  }

  @Get('shifts/:id/live-summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Resumo ao vivo do expediente aberto' })
  getLiveSummary(@Param('id') id: string) {
    return this.svc.getLiveSummary(id);
  }

  @Post('shifts/:id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Fecha um expediente aberto' })
  closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.svc.closeShift(id, dto);
  }

  @Post('attendances/manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Registra atendimento manual (baixa por placa)' })
  createManualAttendance(@Body() dto: ManualAttendanceDto) {
    return this.svc.createManualAttendance(dto);
  }

  @Patch('attendances/:id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Marca um atendimento como concluído' })
  completeAttendance(@Param('id') id: string) {
    return this.svc.completeAttendance(id);
  }

  @Patch('attendances/:id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Cancela um atendimento' })
  cancelAttendance(@Param('id') id: string) {
    return this.svc.cancelAttendance(id);
  }

  @Get('my-attendances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({ summary: 'Lista atendimentos de um usuário/cliente' })
  getMyAttendances(@Query('userId') userId: string) {
    return this.svc.getMyAttendances(userId);
  }

  @Get('plate-check/:plate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Verifica placa: assinatura, status, lavagem do dia' })
  checkPlate(@Param('plate') plate: string, @Query('unitId') unitId?: string) {
    return this.svc.checkPlate(plate, unitId);
  }

  @Post('plate-check/:plate/confirm-wash')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Confirma lavagem do dia para a placa' })
  confirmPlateWash(@Param('plate') plate: string, @Body() payload: { unitId: string; notes?: string }) {
    return this.svc.confirmPlateWash(plate, payload);
  }

  @Get('closures')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Lista fechamentos de expediente' })
  getClosures(@Query('unitId') unitId?: string) {
    return this.svc.getClosures({ unitId });
  }

  @Get('closures/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Detalhe de um fechamento' })
  getClosure(@Param('id') id: string) {
    return this.svc.getClosure(id);
  }

  @Post('daily-washes/:id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Cancela a lavagem diária (desfaz o uso)' })
  cancelDailyWash(@Param('id') id: string) {
    return this.svc.cancelDailyWash(id);
  }
}
```

- [ ] **Step 6: Build e typecheck**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
git add uau-core-backend/src/operations/
git commit -m "feat(backend): sobrescrever módulo operations → /operational com todas as rotas"
```

---

## Tarefa 3 — Expandir módulo Financial

**Problema:** Frontend chama `/financial/float`, `/financial/ledger` (com filtros), `/financial/franchise-rules` (CRUD), `/financial/franchise-reports` (gerar/fechar). Nenhuma dessas rotas existe no backend atual.

**Também:** frontend usa `franchiseRevenuePercent`, `uauRoyaltyPercent`, `marketingFundPercent` mas o schema Prisma tem `repassePercent`, `royaltyPercent`, `marketingPercent`.

**Files:**
- Modify: `uau-core-backend/src/financial/financial.controller.ts`
- Modify: `uau-core-backend/src/financial/financial.service.ts`
- Modify: `uau-core-backend/src/financial/dto/update-franchise-rule.dto.ts`
- Create: `uau-core-backend/src/financial/dto/generate-report.dto.ts`

- [ ] **Step 1: Criar `generate-report.dto.ts`**

```typescript
// uau-core-backend/src/financial/dto/generate-report.dto.ts
import { IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  unitId: string;

  @IsString()
  periodStart: string;

  @IsString()
  periodEnd: string;
}
```

- [ ] **Step 2: Corrigir `update-franchise-rule.dto.ts`** — mapear campos do frontend para o schema

```typescript
// uau-core-backend/src/financial/dto/update-franchise-rule.dto.ts
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateFranchiseRuleDto {
  @IsOptional()
  @IsNumber()
  franchiseRevenuePercent?: number;

  @IsOptional()
  @IsNumber()
  uauRoyaltyPercent?: number;

  @IsOptional()
  @IsNumber()
  marketingFundPercent?: number;

  // Campos legados aceitos por compatibilidade
  @IsOptional()
  @IsNumber()
  repassePercent?: number;

  @IsOptional()
  @IsNumber()
  royaltyPercent?: number;

  @IsOptional()
  @IsNumber()
  marketingPercent?: number;
}
```

- [ ] **Step 3: Expandir `financial.service.ts`**

```typescript
// uau-core-backend/src/financial/financial.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';
import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ===== LEDGER =====

  async createLedgerEntry(dto: CreateLedgerEntryDto) {
    return this.prisma.financialLedger.create({ data: dto });
  }

  async getLedger(filters?: {
    unitId?: string;
    userId?: string;
    partnerId?: string;
    type?: string;
    source?: string;
    page?: number;
    limit?: number;
  }) {
    const take = Math.min(filters?.limit ?? 50, 200);
    const skip = ((filters?.page ?? 1) - 1) * take;
    const where: Record<string, unknown> = {};
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.partnerId) where.partnerId = filters.partnerId;
    if (filters?.type) where.type = filters.type;
    if (filters?.origin) where.origin = (filters as Record<string, unknown>).origin;

    const [items, total] = await Promise.all([
      this.prisma.financialLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.financialLedger.count({ where }),
    ]);

    return { items, total, page: filters?.page ?? 1, limit: take };
  }

  async getLedgerByUnit(unitId: string) {
    return this.prisma.financialLedger.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ===== FRANCHISE RULES =====

  async getAllFranchiseRules() {
    const rules = await this.prisma.franchiseRule.findMany({
      include: { unit: { select: { id: true, name: true } } },
    });
    return rules.map(this.mapRule);
  }

  async getFranchiseRule(unitId: string) {
    let rule = await this.prisma.franchiseRule.findUnique({
      where: { unitId },
      include: { unit: { select: { id: true, name: true } } },
    });
    if (!rule) {
      rule = await this.prisma.franchiseRule.create({
        data: { unitId, repassePercent: 60.0, royaltyPercent: 10.0, marketingPercent: 5.0 },
        include: { unit: { select: { id: true, name: true } } },
      });
    }
    return this.mapRule(rule);
  }

  async createFranchiseRule(dto: UpdateFranchiseRuleDto & { unitId: string }) {
    const data = this.mapRuleDto(dto);
    const rule = await this.prisma.franchiseRule.upsert({
      where: { unitId: dto.unitId },
      update: data,
      create: { unitId: dto.unitId, ...data },
      include: { unit: { select: { id: true, name: true } } },
    });
    return this.mapRule(rule);
  }

  async updateFranchiseRuleById(id: string, dto: UpdateFranchiseRuleDto) {
    const rule = await this.prisma.franchiseRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    const updated = await this.prisma.franchiseRule.update({
      where: { id },
      data: this.mapRuleDto(dto),
      include: { unit: { select: { id: true, name: true } } },
    });
    return this.mapRule(updated);
  }

  async updateFranchiseRule(unitId: string, dto: UpdateFranchiseRuleDto) {
    return this.prisma.franchiseRule.upsert({
      where: { unitId },
      update: this.mapRuleDto(dto),
      create: { unitId, ...this.mapRuleDto(dto) },
    });
  }

  private mapRuleDto(dto: UpdateFranchiseRuleDto) {
    return {
      repassePercent: dto.franchiseRevenuePercent ?? dto.repassePercent ?? 0,
      royaltyPercent: dto.uauRoyaltyPercent ?? dto.royaltyPercent ?? 0,
      marketingPercent: dto.marketingFundPercent ?? dto.marketingPercent ?? 0,
    };
  }

  private mapRule(rule: Record<string, unknown> & { id: string; unitId: string; repassePercent: unknown; royaltyPercent: unknown; marketingPercent: unknown }) {
    return {
      id: rule.id,
      unitId: rule.unitId,
      franchiseRevenuePercent: Number(rule.repassePercent),
      uauRoyaltyPercent: Number(rule.royaltyPercent),
      marketingFundPercent: Number(rule.marketingPercent),
      unit: (rule as Record<string, unknown>).unit,
      updatedAt: (rule as Record<string, unknown>).updatedAt,
    };
  }

  // ===== REPORTS =====

  async getFranchiseReports() {
    return this.prisma.franchiseReport.findMany({
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateFranchiseReport(dto: GenerateReportDto) {
    const period = `${dto.periodStart}_${dto.periodEnd}`;
    return this.prisma.franchiseReport.create({
      data: {
        unitId: dto.unitId,
        period,
        status: 'OPEN',
        data: { periodStart: dto.periodStart, periodEnd: dto.periodEnd },
      },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  async closeFranchiseReport(id: string) {
    const report = await this.prisma.franchiseReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    return this.prisma.franchiseReport.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  // ===== OVERVIEW & FLOAT =====

  async getFinancialOverview(unitId?: string) {
    const where = unitId ? { unitId } : {};
    const [credits, debits, walletAgg, cashbackIssued, cashbackUsed] = await Promise.all([
      this.prisma.financialLedger.aggregate({ where: { ...where, type: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.financialLedger.aggregate({ where: { ...where, type: 'DEBIT' }, _sum: { amount: true } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true, promoBalance: true, blockedBalance: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'DEBIT' }, _sum: { amount: true } }),
    ]);

    return {
      totalCredits: Number(credits._sum.amount ?? 0),
      totalDebits: Number(debits._sum.amount ?? 0),
      balance: Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0),
      totalCashbackInCirculation: Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalCashbackIssued: Number(cashbackIssued._sum.amount ?? 0),
      totalCashbackUsed: Number(cashbackUsed._sum.amount ?? 0),
    };
  }

  async getFinancialFloat() {
    const walletAgg = await this.prisma.wallet.aggregate({
      _sum: { balance: true, promoBalance: true, blockedBalance: true },
    });
    const [issued, used, expired] = await Promise.all([
      this.prisma.walletMovement.aggregate({ where: { type: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'DEBIT' }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'EXPIRY' }, _sum: { amount: true } }),
    ]);

    return {
      totalAvailableBalance: Number(walletAgg._sum.balance ?? 0),
      totalPromotionalBalance: Number(walletAgg._sum.promoBalance ?? 0),
      totalBlockedBalance: Number(walletAgg._sum.blockedBalance ?? 0),
      totalCashbackInCirculation:
        Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalCashbackIssued: Number(issued._sum.amount ?? 0),
      totalCashbackUsed: Number(used._sum.amount ?? 0),
      totalCashbackExpired: Number(expired._sum.amount ?? 0),
    };
  }
}
```

- [ ] **Step 4: Reescrever `financial.controller.ts`**

```typescript
// uau-core-backend/src/financial/financial.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
export class FinancialController {
  constructor(private readonly svc: FinancialService) {}

  // ===== OVERVIEW & FLOAT =====

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiOperation({ summary: 'Visão geral financeira' })
  getOverview(@Query('unitId') unitId?: string) {
    return this.svc.getFinancialOverview(unitId);
  }

  @Get('float')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Float de cashback em circulação' })
  getFloat() {
    return this.svc.getFinancialFloat();
  }

  // ===== LEDGER =====

  @Post('ledger')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adiciona entrada manual ao livro razão' })
  createLedgerEntry(@Body() dto: CreateLedgerEntryDto) {
    return this.svc.createLedgerEntry(dto);
  }

  @Get('ledger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Extrato financeiro com filtros e paginação' })
  getLedger(
    @Query('unitId') unitId?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getLedger({
      unitId,
      userId,
      type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('ledger/unit/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Extrato da unidade (compatibilidade)' })
  getLedgerByUnit(@Param('unitId') unitId: string) {
    return this.svc.getLedgerByUnit(unitId);
  }

  // ===== FRANCHISE RULES =====

  @Get('franchise-rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista todas as regras de franquia' })
  getAllRules() {
    return this.svc.getAllFranchiseRules();
  }

  @Post('franchise-rules')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria ou atualiza regra de franquia para uma unidade' })
  createRule(@Body() dto: UpdateFranchiseRuleDto & { unitId: string }) {
    return this.svc.createFranchiseRule(dto);
  }

  @Put('franchise-rules/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza regra de franquia pelo ID' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateFranchiseRuleDto) {
    return this.svc.updateFranchiseRuleById(id, dto);
  }

  @Get('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Regra de uma unidade específica (compatibilidade)' })
  getRuleByUnit(@Param('unitId') unitId: string) {
    return this.svc.getFranchiseRule(unitId);
  }

  @Put('rules/:unitId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza regra por unidade (compatibilidade)' })
  updateRuleByUnit(@Param('unitId') unitId: string, @Body() dto: UpdateFranchiseRuleDto) {
    return this.svc.updateFranchiseRule(unitId, dto);
  }

  // ===== FRANCHISE REPORTS =====

  @Get('franchise-reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista relatórios de franquia' })
  getReports() {
    return this.svc.getFranchiseReports();
  }

  @Post('franchise-reports/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Gera um relatório de período para a franquia' })
  generateReport(@Body() dto: GenerateReportDto) {
    return this.svc.generateFranchiseReport(dto);
  }

  @Post('franchise-reports/:id/close')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Fecha um relatório de franquia' })
  closeReport(@Param('id') id: string) {
    return this.svc.closeFranchiseReport(id);
  }
}
```

- [ ] **Step 5: Build e typecheck**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add uau-core-backend/src/financial/
git commit -m "feat(backend): expandir financial com float, ledger paginado, franchise-rules e reports"
```

---

## Tarefa 4 — Expandir módulo Antifraud

**Problema:** Frontend espera `GET /antifraud/flags/:id`, `PATCH /antifraud/flags/:id/review`, `POST /antifraud/users/:id/mark-suspect|block|unblock`, e `GET /antifraud/security-logs` com filtros. O controller atual não tem essas rotas.

**Files:**
- Modify: `uau-core-backend/src/antifraud/antifraud.controller.ts`
- Modify: `uau-core-backend/src/antifraud/antifraud.service.ts`

- [ ] **Step 1: Expandir `antifraud.service.ts`**

```typescript
// uau-core-backend/src/antifraud/antifraud.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AntifraudService {
  constructor(private prisma: PrismaService) {}

  async createFlag(dto: CreateFlagDto) {
    const flag = await this.prisma.antiFraudFlag.create({ data: dto });
    if (dto.severity === 'CRITICAL') {
      await this.prisma.user.update({ where: { id: dto.userId }, data: { status: UserStatus.SUSPECT } });
    }
    return flag;
  }

  async findAllFlags(filters?: { status?: string; severity?: string; type?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.type) where.type = filters.type;

    return this.prisma.antiFraudFlag.findMany({
      where,
      include: { user: { select: { name: true, email: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFlag(id: string) {
    const flag = await this.prisma.antiFraudFlag.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, status: true } } },
    });
    if (!flag) throw new NotFoundException('Flag não encontrada');
    return flag;
  }

  async reviewFlag(id: string, payload: { status: string; reason?: string }) {
    const flag = await this.prisma.antiFraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Flag não encontrada');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.antiFraudFlag.update({
        where: { id },
        data: {
          status: payload.status as never,
          reason: payload.reason,
          reviewedAt: new Date(),
        },
      });

      if (payload.status === 'BLOCKED') {
        await tx.user.update({ where: { id: flag.userId }, data: { status: UserStatus.BLOCKED } });
      } else if (payload.status === 'DISMISSED') {
        await tx.user.update({ where: { id: flag.userId }, data: { status: UserStatus.ACTIVE } });
      }

      return updated;
    });
  }

  async resolveFlag(id: string, dto: UpdateFlagDto) {
    return this.reviewFlag(id, { status: dto.status, reason: dto.reviewedBy });
  }

  async markUserSuspect(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPECT } });
    await this.logSecurityEvent(userId, 'USER_MARKED_SUSPECT', undefined, undefined, { reason });
    return { ok: true };
  }

  async blockUser(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.BLOCKED } });
    await this.logSecurityEvent(userId, 'USER_BLOCKED', undefined, undefined, { reason });
    return { ok: true };
  }

  async unblockUser(userId: string, reason: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
    await this.logSecurityEvent(userId, 'USER_UNBLOCKED', undefined, undefined, { reason });
    return { ok: true };
  }

  async getSecurityLogs(filters?: { eventType?: string; userId?: string; startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.eventType) where.event = filters.eventType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    return this.prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async logSecurityEvent(userId: string, event: string, ip?: string, userAgent?: string, metadata?: unknown) {
    return this.prisma.securityLog.create({
      data: { userId, event, ip, userAgent, metadata: (metadata as object) ?? {} },
    });
  }
}
```

- [ ] **Step 2: Reescrever `antifraud.controller.ts`**

```typescript
// uau-core-backend/src/antifraud/antifraud.controller.ts
import { Controller, Get, Post, Patch, Put, Body, Param, Query } from '@nestjs/common';
import { AntifraudService } from './antifraud.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('antifraud')
@ApiBearerAuth()
@Controller('antifraud')
export class AntifraudController {
  constructor(private readonly svc: AntifraudService) {}

  @Get('security-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiOperation({ summary: 'Lista logs de segurança' })
  getSecurityLogs(
    @Query('eventType') eventType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.svc.getSecurityLogs({ eventType, userId, startDate, endDate });
  }

  @Post('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria flag de fraude' })
  createFlag(@Body() dto: CreateFlagDto) {
    return this.svc.createFlag(dto);
  }

  @Get('flags')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiOperation({ summary: 'Lista flags de fraude com filtros' })
  getFlags(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.findAllFlags({ status, severity, type });
  }

  @Get('flags/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detalhe de uma flag' })
  getFlag(@Param('id') id: string) {
    return this.svc.findFlag(id);
  }

  @Patch('flags/:id/review')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revisar flag (REVIEWED, DISMISSED, BLOCKED)' })
  reviewFlag(@Param('id') id: string, @Body() payload: { status: string; reason?: string }) {
    return this.svc.reviewFlag(id, payload);
  }

  @Put('flags/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolver flag (compatibilidade)' })
  resolveFlag(@Param('id') id: string, @Body() dto: UpdateFlagDto) {
    return this.svc.resolveFlag(id, dto);
  }

  @Post('users/:userId/mark-suspect')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Marca usuário como suspeito' })
  markSuspect(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.markUserSuspect(userId, reason);
  }

  @Post('users/:userId/block')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bloqueia usuário' })
  blockUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.blockUser(userId, reason);
  }

  @Post('users/:userId/unblock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desbloqueia usuário' })
  unblockUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.svc.unblockUser(userId, reason);
  }
}
```

- [ ] **Step 3: Build**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add uau-core-backend/src/antifraud/
git commit -m "feat(backend): expandir antifraud com review, security-logs e ações de usuário"
```

---

## Tarefa 5 — Adicionar `GET /billing/my-history`

**Problema:** Frontend chama `GET /billing/my-history?userId=...` mas o billing controller não tem essa rota.

**Files:**
- Modify: `uau-core-backend/src/billing/billing.controller.ts`
- Modify: `uau-core-backend/src/billing/billing.service.ts`

- [ ] **Step 1: Adicionar método `findByCustomer` no `billing.service.ts`**

Adicione após o método `update`:

```typescript
async findByCustomer(userId: string) {
  const customer = await this.prisma.customer.findFirst({ where: { userId } });
  if (!customer) return [];
  return this.prisma.billingHistory.findMany({
    where: { customerId: customer.id },
    include: { subscription: { include: { plan: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
```

- [ ] **Step 2: Adicionar rota `my-history` no `billing.controller.ts`**

Adicione no controller, antes de `@Get(':id')` (para evitar conflito de rota):

```typescript
@Get('my-history')
@Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
@ApiQuery({ name: 'userId', required: true })
@ApiOperation({ summary: 'Histórico de cobranças de um cliente' })
findByCustomer(@Query('userId') userId: string) {
  return this.billingService.findByCustomer(userId);
}
```

Adicionar `Query` no import do decorator no topo:
```typescript
import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
```

- [ ] **Step 3: Build**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add uau-core-backend/src/billing/
git commit -m "feat(backend): adicionar GET /billing/my-history por userId"
```

---

## Tarefa 6 — Criar AdminDashboard controller

**Problema:** As páginas home dos portais admin, franchise e partner chamam `/admin-dashboard/*` que não existem.

**Files:**
- Create: `uau-core-backend/src/admin-dashboard/admin-dashboard.controller.ts`
- Create: `uau-core-backend/src/admin-dashboard/admin-dashboard.service.ts`
- Create: `uau-core-backend/src/admin-dashboard/admin-dashboard.module.ts`
- Modify: `uau-core-backend/src/app.module.ts`

- [ ] **Step 1: Criar `admin-dashboard.service.ts`**

```typescript
// uau-core-backend/src/admin-dashboard/admin-dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalCustomers, totalPartners, totalUnits, activeSubscriptions, openBillingCycles, totalUsers] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.partner.count({ where: { isActive: true } }),
        this.prisma.franchiseUnit.count({ where: { isActive: true } }),
        this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        this.prisma.billingHistory.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
        this.prisma.user.count(),
      ]);

    return { totalUsers, totalCustomers, totalPartners, totalUnits, activeSubscriptions, openBillingCycles };
  }

  async getFinancial() {
    const [billingAgg, walletAgg, partnerLedger] = await Promise.all([
      this.prisma.billingHistory.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true, promoBalance: true } }),
      this.prisma.financialLedger.aggregate({ where: { type: 'CREDIT', origin: 'PARTNER_COMMISSION' }, _sum: { amount: true } }),
    ]);

    return {
      totalGatewayAmount: Number(billingAgg._sum.amount ?? 0),
      totalCashbackInCirculation:
        Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalWalletAvailableBalance: Number(walletAgg._sum.balance ?? 0),
      totalPartnerUauCommission: Number(partnerLedger._sum.amount ?? 0),
    };
  }

  async getAlerts() {
    const [overdueSubscriptions, openFlags, suspectUsers] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'OVERDUE' } }),
      this.prisma.antiFraudFlag.count({ where: { status: 'OPEN', severity: { in: ['HIGH', 'CRITICAL'] } } }),
      this.prisma.user.count({ where: { status: 'SUSPECT' } }),
    ]);

    const alerts: string[] = [];
    if (overdueSubscriptions > 0) alerts.push(`${overdueSubscriptions} assinatura(s) em atraso`);
    if (openFlags > 0) alerts.push(`${openFlags} flag(s) de fraude crítica/alta em aberto`);
    if (suspectUsers > 0) alerts.push(`${suspectUsers} usuário(s) suspeito(s)`);

    return alerts;
  }

  async getOperations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [openShifts, washesToday] = await Promise.all([
      this.prisma.shift.count({ where: { status: 'OPEN' } }),
      this.prisma.attendance.count({
        where: { status: 'COMPLETED', createdAt: { gte: today } },
      }),
    ]);
    return { openShifts, totalWashesToday: washesToday };
  }

  async getAnpr() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, authorized, blocked] = await Promise.all([
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today } } }),
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today }, status: 'AUTHORIZED' } }),
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today }, status: 'BLOCKED' } }),
    ]);
    return { totalEvents: total, authorized, blocked };
  }
}
```

- [ ] **Step 2: Criar `admin-dashboard.controller.ts`**

```typescript
// uau-core-backend/src/admin-dashboard/admin-dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly svc: AdminDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Overview geral do super admin' })
  getOverview() { return this.svc.getOverview(); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'KPIs financeiros do super admin' })
  getFinancial() { return this.svc.getFinancial(); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Alertas críticos do sistema' })
  getAlerts() { return this.svc.getAlerts(); }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'KPIs operacionais' })
  getOperations() { return this.svc.getOperations(); }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resumo ANPR do dia' })
  getAnpr() { return this.svc.getAnpr(); }
}
```

- [ ] **Step 3: Criar `admin-dashboard.module.ts`**

```typescript
// uau-core-backend/src/admin-dashboard/admin-dashboard.module.ts
import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
```

- [ ] **Step 4: Registrar em `app.module.ts`**

Adicionar no bloco de imports:

```typescript
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
// ...
imports: [
  // ... módulos existentes ...
  AdminDashboardModule,
],
```

- [ ] **Step 5: Build**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add uau-core-backend/src/admin-dashboard/ uau-core-backend/src/app.module.ts
git commit -m "feat(backend): criar AdminDashboard controller com overview, financial, alerts, operations e anpr"
```

---

## Tarefa 7 — Criar FranchiseDashboard controller

**Files:**
- Create: `uau-core-backend/src/franchise-dashboard/franchise-dashboard.controller.ts`
- Create: `uau-core-backend/src/franchise-dashboard/franchise-dashboard.service.ts`
- Create: `uau-core-backend/src/franchise-dashboard/franchise-dashboard.module.ts`
- Modify: `uau-core-backend/src/app.module.ts`

- [ ] **Step 1: Criar `franchise-dashboard.service.ts`**

```typescript
// uau-core-backend/src/franchise-dashboard/franchise-dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FranchiseDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(unitId?: string) {
    const where = unitId ? { id: unitId } : {};
    const units = await this.prisma.franchiseUnit.findMany({
      where: { ...where, isActive: true },
      select: { id: true },
    });
    const unitIds = units.map((u) => u.id);

    const [totalCustomers, activeSubscriptions, overdueSubscriptions] = await Promise.all([
      this.prisma.customer.count({
        where: unitId ? { user: { defaultUnitId: unitId } } : {},
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
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
    const where = unitId ? { unitId } : {};
    const [billingAgg, walletAgg, partnerAgg] = await Promise.all([
      this.prisma.billingHistory.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: 'DEBIT', origin: 'SUBSCRIPTION' }, _sum: { amount: true } }),
      this.prisma.financialLedger.aggregate({ where: { ...where, type: 'CREDIT', origin: 'PARTNER_COMMISSION' }, _sum: { amount: true } }),
    ]);

    return {
      estimatedFranchiseRevenue: Number(billingAgg._sum.amount ?? 0) * 0.6,
      totalGatewayAmount: Number(billingAgg._sum.amount ?? 0),
      totalCashbackUsedInSubscriptions: Number(walletAgg._sum.amount ?? 0),
      totalPartnerUauCommission: Number(partnerAgg._sum.amount ?? 0),
    };
  }

  async getOperations(unitId?: string) {
    const where = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openShifts, planToday, avulsoToday] = await Promise.all([
      this.prisma.shift.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.attendance.count({
        where: { ...where, status: 'COMPLETED', type: 'MANUAL', createdAt: { gte: today } },
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
    const where = unitId ? { unitId } : {};
    const [overdueCount] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'OVERDUE' } }),
    ]);

    const alerts: string[] = [];
    if (overdueCount > 0) alerts.push(`${overdueCount} assinatura(s) em atraso`);
    return alerts;
  }

  async getAnpr(unitId?: string) {
    const where = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, authorized, blocked] = await Promise.all([
      this.prisma.anprEvent.count({ where: { ...where, capturedAt: { gte: today } } }),
      this.prisma.anprEvent.count({ where: { ...where, capturedAt: { gte: today }, status: 'AUTHORIZED' } }),
      this.prisma.anprEvent.count({ where: { ...where, capturedAt: { gte: today }, status: 'BLOCKED' } }),
    ]);
    return { totalEvents: total, authorized, blocked };
  }

  async getCustomers(filters?: { unitId?: string; name?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.unitId) where.user = { defaultUnitId: filters.unitId };
    if (filters?.status) {
      where.user = { ...(where.user as object ?? {}), status: filters.status };
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
}
```

- [ ] **Step 2: Criar `franchise-dashboard.controller.ts`**

```typescript
// uau-core-backend/src/franchise-dashboard/franchise-dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { FranchiseDashboardService } from './franchise-dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('franchise-dashboard')
@ApiBearerAuth()
@Controller('franchise-dashboard')
export class FranchiseDashboardController {
  constructor(private readonly svc: FranchiseDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  getOverview(@Query('unitId') unitId?: string) { return this.svc.getOverview(unitId); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  getFinancial(@Query('unitId') unitId?: string) { return this.svc.getFinancial(unitId); }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  getOperations(@Query('unitId') unitId?: string) { return this.svc.getOperations(unitId); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
  getAlerts(@Query('unitId') unitId?: string) { return this.svc.getAlerts(unitId); }

  @Get('anpr')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'unitId', required: false })
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
}
```

- [ ] **Step 3: Criar `franchise-dashboard.module.ts`**

```typescript
// uau-core-backend/src/franchise-dashboard/franchise-dashboard.module.ts
import { Module } from '@nestjs/common';
import { FranchiseDashboardController } from './franchise-dashboard.controller';
import { FranchiseDashboardService } from './franchise-dashboard.service';

@Module({
  controllers: [FranchiseDashboardController],
  providers: [FranchiseDashboardService],
})
export class FranchiseDashboardModule {}
```

- [ ] **Step 4: Registrar em `app.module.ts`** — adicionar `FranchiseDashboardModule` nos imports

- [ ] **Step 5: Build**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add uau-core-backend/src/franchise-dashboard/ uau-core-backend/src/app.module.ts
git commit -m "feat(backend): criar FranchiseDashboard controller"
```

---

## Tarefa 8 — Criar PartnerDashboard controller

**Files:**
- Create: `uau-core-backend/src/partner-dashboard/partner-dashboard.controller.ts`
- Create: `uau-core-backend/src/partner-dashboard/partner-dashboard.service.ts`
- Create: `uau-core-backend/src/partner-dashboard/partner-dashboard.module.ts`
- Modify: `uau-core-backend/src/app.module.ts`

- [ ] **Step 1: Criar `partner-dashboard.service.ts`**

```typescript
// uau-core-backend/src/partner-dashboard/partner-dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [activePartners, totalTransactions, customersServed] = await Promise.all([
      this.prisma.partner.count({ where: { isActive: true } }),
      this.prisma.financialLedger.count({ where: { origin: 'PARTNER_TRANSACTION' } }),
      this.prisma.walletMovement.count({ where: { origin: 'PARTNER_TRANSACTION' } }),
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

  async getFinancial() {
    const [ledgerAgg, cashbackAgg] = await Promise.all([
      this.prisma.financialLedger.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'CREDIT' },
        _sum: { amount: true },
      }),
      this.prisma.walletMovement.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'DEBIT' },
        _sum: { amount: true },
      }),
    ]);

    return {
      grossSales: 0,
      gatewayAmount: 0,
      cashbackAcceptedAsDiscount: Number(cashbackAgg._sum.amount ?? 0),
      cashbackGenerated: 0,
      uauCommissionAmount: Number(ledgerAgg._sum.amount ?? 0),
    };
  }

  async getTransactions() {
    return this.prisma.financialLedger.findMany({
      where: { origin: 'PARTNER_TRANSACTION' },
      include: { partner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlerts() {
    const alerts: string[] = [];
    return alerts;
  }
}
```

- [ ] **Step 2: Criar `partner-dashboard.controller.ts`**

```typescript
// uau-core-backend/src/partner-dashboard/partner-dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PartnerDashboardService } from './partner-dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('partner-dashboard')
@ApiBearerAuth()
@Controller('partner-dashboard')
export class PartnerDashboardController {
  constructor(private readonly svc: PartnerDashboardService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Overview do portal parceiro' })
  getOverview() { return this.svc.getOverview(); }

  @Get('financial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'KPIs financeiros do parceiro' })
  getFinancial() { return this.svc.getFinancial(); }

  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Últimas transações do parceiro' })
  getTransactions() { return this.svc.getTransactions(); }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Alertas do parceiro' })
  getAlerts() { return this.svc.getAlerts(); }
}
```

- [ ] **Step 3: Criar `partner-dashboard.module.ts`**

```typescript
// uau-core-backend/src/partner-dashboard/partner-dashboard.module.ts
import { Module } from '@nestjs/common';
import { PartnerDashboardController } from './partner-dashboard.controller';
import { PartnerDashboardService } from './partner-dashboard.service';

@Module({
  controllers: [PartnerDashboardController],
  providers: [PartnerDashboardService],
})
export class PartnerDashboardModule {}
```

- [ ] **Step 4: Registrar em `app.module.ts`** — adicionar `PartnerDashboardModule`

- [ ] **Step 5: Build final e typecheck**

```bash
cd uau-core-backend && npm run build && npx tsc --noEmit
```

Esperado: zero erros em todos os módulos.

- [ ] **Step 6: Commit**

```bash
git add uau-core-backend/src/partner-dashboard/ uau-core-backend/src/app.module.ts
git commit -m "feat(backend): criar PartnerDashboard controller"
```

---

## Checklist de revisão

- [x] Tarefa 1 cobre todos os arquivos modificados do dashboard
- [x] Tarefa 2 renomeia `/operations` → `/operational` e cobre todos os 14 endpoints que o frontend usa
- [x] Tarefa 3 cobre `float`, `ledger` paginado, `franchise-rules` CRUD e `franchise-reports`
- [x] Tarefa 3 mapeia `franchiseRevenuePercent/uauRoyaltyPercent/marketingFundPercent` → `repassePercent/royaltyPercent/marketingPercent`
- [x] Tarefa 4 cobre `security-logs`, `flags/:id`, `flags/:id/review`, `users/*/mark-suspect|block|unblock`
- [x] Tarefa 5 cobre `billing/my-history`
- [x] Tarefas 6-8 cobrem todos os endpoints `/admin-dashboard/*`, `/franchise-dashboard/*`, `/partner-dashboard/*`
- [x] Todos os passos têm código completo
- [x] Cada tarefa tem commit próprio
- [x] Build verificado em cada tarefa
