import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        readings: dto.openingReadings ? ({ opening: dto.openingReadings, notes: dto.openingNotes } as unknown as Prisma.InputJsonValue) : undefined,
      },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  async getShifts(filters?: { unitId?: string; status?: string }) {
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
        type: 'MANUAL',
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
          readings: ({ closing: dto.closingReadings, notes: dto.closingNotes ?? dto.notes } as unknown as Prisma.InputJsonValue),
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

  async getClosures(filters?: { unitId?: string }) {
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
    const customer = await this.prisma.customer.findFirst({ where: { userId } });
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
