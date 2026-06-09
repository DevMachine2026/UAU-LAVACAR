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
    return this.prisma.plan.create({ data: createDto });
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
    return this.prisma.plan.update({ where: { id }, data: updateDto }).catch(() => {
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
    return this.prisma.planVehicleSizePrice.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Preço por porte não encontrado');
    });
  }
}
