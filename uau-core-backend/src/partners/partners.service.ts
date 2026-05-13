import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePartnerDto) {
    return this.prisma.partner.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.partner.findMany({
      include: {
        state: true,
        city: true,
      },
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        state: true,
        city: true,
      },
    });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    return partner;
  }

  async update(id: string, updateDto: UpdatePartnerDto) {
    return this.prisma.partner.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Parceiro não encontrado');
    });
  }
}
