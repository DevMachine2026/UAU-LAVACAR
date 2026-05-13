import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        customer: { select: { user: { select: { name: true } }, phone: true } },
        sizeCategory: true,
      },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: { select: { user: { select: { name: true, email: true } }, phone: true, cpf: true } },
        sizeCategory: true,
        dailyWashes: { take: 5, orderBy: { date: 'desc' } },
      },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return vehicle;
  }

  async update(id: string, updateDto: UpdateVehicleDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Veículo não encontrado');
    });
  }
}
