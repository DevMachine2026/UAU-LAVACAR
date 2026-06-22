import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseUnitDto } from './dto/create-franchise-unit.dto';
import { UpdateFranchiseUnitDto } from './dto/update-franchise-unit.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { UpsertWorkingHoursDto } from './dto/upsert-working-hours.dto';

const UNIT_INCLUDE = {
  state: true,
  city: true,
  workingHours: { orderBy: { dayOfWeek: 'asc' as const } },
  equipments: { orderBy: { name: 'asc' as const } },
} as const;

@Injectable()
export class FranchiseUnitsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateFranchiseUnitDto) {
    return this.prisma.franchiseUnit.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.franchiseUnit.findMany({
      include: UNIT_INCLUDE,
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.franchiseUnit.findUnique({
      where: { id },
      include: UNIT_INCLUDE,
    });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return unit;
  }

  async update(id: string, updateDto: UpdateFranchiseUnitDto, actorId?: string) {
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, id);
    return this.prisma.franchiseUnit.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Unidade não encontrada');
    });
  }

  async activate(id: string) {
    return this.prisma.franchiseUnit.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Unidade não encontrada'); });
  }

  async deactivate(id: string) {
    return this.prisma.franchiseUnit.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Unidade não encontrada'); });
  }

  async updateEquipmentStatus(unitId: string, equipmentId: string, dto: UpdateEquipmentStatusDto, actorId?: string) {
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    const equipment = await this.prisma.unitEquipment.findFirst({
      where: { id: equipmentId, franchiseUnitId: unitId },
    });
    if (!equipment) throw new NotFoundException('Equipamento não encontrado');

    return this.prisma.unitEquipment.update({
      where: { id: equipmentId },
      data: { status: dto.status },
    });
  }

  async upsertWorkingHours(unitId: string, dto: UpsertWorkingHoursDto, actorId?: string) {
    if (actorId) await this.assertFranchiseOwnerOwnsUnit(actorId, unitId);
    const unit = await this.prisma.franchiseUnit.findUnique({ where: { id: unitId }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');

    if (new Set(dto.hours.map((h) => h.dayOfWeek)).size !== dto.hours.length) {
      throw new BadRequestException('Dias da semana duplicados');
    }

    await this.prisma.$transaction(
      dto.hours.map((h) =>
        this.prisma.unitWorkingHours.upsert({
          where: { franchiseUnitId_dayOfWeek: { franchiseUnitId: unitId, dayOfWeek: h.dayOfWeek } },
          create: {
            franchiseUnitId: unitId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed ?? false,
          },
          update: {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed ?? false,
          },
        }),
      ),
    );

    return this.prisma.unitWorkingHours.findMany({
      where: { franchiseUnitId: unitId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  private async assertFranchiseOwnerOwnsUnit(userId: string, unitId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { defaultUnitId: true },
    });
    if (!user || user.defaultUnitId !== unitId) {
      throw new ForbiddenException('Franqueado não tem acesso a esta unidade');
    }
  }
}
