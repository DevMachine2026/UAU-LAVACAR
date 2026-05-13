import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

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
        vehicleSizePrices: true,
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        availabilities: true,
        vehicleSizePrices: true,
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
}
