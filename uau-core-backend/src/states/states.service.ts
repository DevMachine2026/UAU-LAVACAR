import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.state.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findCitiesByState(stateId: string) {
    return this.prisma.city.findMany({
      where: { stateId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
