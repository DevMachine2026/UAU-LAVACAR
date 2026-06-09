import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseUnitDto } from './dto/create-franchise-unit.dto';
import { UpdateFranchiseUnitDto } from './dto/update-franchise-unit.dto';

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
      include: {
        state: true,
        city: true,
      },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.franchiseUnit.findUnique({
      where: { id },
      include: {
        state: true,
        city: true,
      },
    });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return unit;
  }

  async update(id: string, updateDto: UpdateFranchiseUnitDto) {
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
}
