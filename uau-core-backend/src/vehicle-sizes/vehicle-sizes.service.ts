import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleSizeDto } from './dto/create-vehicle-size.dto';
import { UpdateVehicleSizeDto } from './dto/update-vehicle-size.dto';

@Injectable()
export class VehicleSizesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVehicleSizeDto) {
    return this.prisma.vehicleSizeCategory.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.vehicleSizeCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const size = await this.prisma.vehicleSizeCategory.findUnique({
      where: { id },
    });
    if (!size) throw new NotFoundException('Categoria de tamanho não encontrada');
    return size;
  }

  async update(id: string, updateDto: UpdateVehicleSizeDto) {
    return this.prisma.vehicleSizeCategory.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Categoria de tamanho não encontrada');
    });
  }
}
