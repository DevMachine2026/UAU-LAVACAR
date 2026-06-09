import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string) {
    return this.prisma.city.findMany({
      where: { isActive: true, ...(stateId ? { stateId } : {}) },
      include: { state: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: { state: { select: { id: true, name: true, code: true } } },
    });
    if (!city) throw new NotFoundException('Cidade não encontrada');
    return city;
  }

  async create(dto: CreateCityDto) {
    return this.prisma.city.create({
      data: dto,
      include: { state: { select: { id: true, name: true, code: true } } },
    });
  }

  async update(id: string, dto: UpdateCityDto) {
    return this.prisma.city.update({
      where: { id },
      data: dto,
      include: { state: { select: { id: true, name: true, code: true } } },
    }).catch(() => { throw new NotFoundException('Cidade não encontrada'); });
  }

  async remove(id: string) {
    return this.prisma.city.delete({
      where: { id },
    }).catch(() => { throw new NotFoundException('Cidade não encontrada'); });
  }
}
