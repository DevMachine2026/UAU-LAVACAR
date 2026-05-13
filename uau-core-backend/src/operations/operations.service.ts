import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { RegisterAttendanceDto } from './dto/register-attendance.dto';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  // ==================== SHIFTS (Turnos) ====================

  async openShift(openShiftDto: OpenShiftDto) {
    // Verifica se já existe um turno aberto para esta unidade
    const activeShift = await this.prisma.shift.findFirst({
      where: {
        unitId: openShiftDto.franchiseUnitId,
        status: 'OPEN',
      },
    });

    if (activeShift) {
      throw new ConflictException('Já existe um turno aberto para esta unidade');
    }

    return this.prisma.shift.create({
      data: {
        unitId: openShiftDto.franchiseUnitId,
        operatorId: openShiftDto.operatorId,
        status: 'OPEN',
        openedAt: new Date(),
      },
    });
  }

  async closeShift(shiftId: string, closeShiftDto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Turno não encontrado');
    if (shift.status === 'CLOSED') throw new ConflictException('Turno já está fechado');

    return this.prisma.$transaction(async (tx) => {
      const updatedShift = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      await tx.shiftClosure.create({
        data: {
          shiftId: shiftId,
          notes: closeShiftDto.notes,
          closedAt: new Date(),
        }
      });

      return updatedShift;
    });
  }

  async getActiveShift(franchiseUnitId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { unitId: franchiseUnitId, status: 'OPEN' },
    });
    if (!shift) throw new NotFoundException('Nenhum turno aberto para esta unidade');
    return shift;
  }

  // ==================== ATTENDANCES (Atendimentos/Lavagens) ====================

  async registerAttendance(createDto: RegisterAttendanceDto) {
    // Verifica se tem turno aberto
    const activeShift = await this.getActiveShift(createDto.franchiseUnitId);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createDto.vehicleId }
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');

    // Registra a lavagem diária
    return this.prisma.attendance.create({
      data: {
        shiftId: activeShift.id,
        vehicleId: createDto.vehicleId,
        plate: vehicle.plate,
        status: createDto.status || 'COMPLETED',
        type: 'MANUAL',
        completedAt: createDto.status === 'COMPLETED' || !createDto.status ? new Date() : null,
      },
    });
  }

  async getAttendancesByUnit(franchiseUnitId: string) {
    return this.prisma.attendance.findMany({
      where: { shift: { unitId: franchiseUnitId } },
      include: {
        vehicle: { include: { customer: { select: { user: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
