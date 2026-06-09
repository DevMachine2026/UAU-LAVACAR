import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Injectable()
export class StatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.state.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const state = await this.prisma.state.findUnique({ where: { id } });
    if (!state) throw new NotFoundException('Estado não encontrado');
    return state;
  }

  async findCitiesByState(stateId: string) {
    return this.prisma.city.findMany({
      where: { stateId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateStateDto) {
    return this.prisma.state.create({ data: dto });
  }

  async update(id: string, dto: UpdateStateDto) {
    return this.prisma.state.update({
      where: { id },
      data: dto,
    }).catch(() => { throw new NotFoundException('Estado não encontrado'); });
  }

  async remove(id: string) {
    return this.prisma.state.delete({
      where: { id },
    }).catch(() => { throw new NotFoundException('Estado não encontrado'); });
  }
}
