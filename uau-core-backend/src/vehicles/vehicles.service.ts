import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVehicleDto, user?: User) {
    const customerId = await this.resolveCustomerId(createDto.customerId, user);

    return this.prisma.vehicle.create({
      data: {
        ...createDto,
        customerId,
      },
    });
  }

  async findAll(user?: User) {
    const include = {
      customer: { select: { user: { select: { name: true } }, phone: true } },
      sizeCategory: true,
    };

    if (user?.role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!customer) {
        return [];
      }

      return this.prisma.vehicle.findMany({
        where: { customerId: customer.id },
        include,
      });
    }

    return this.prisma.vehicle.findMany({ include });
  }

  private async resolveCustomerId(customerId: string | undefined, user?: User) {
    if (user?.role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado para este usuário');
      }

      return customer.id;
    }

    if (!customerId) {
      throw new BadRequestException('customerId é obrigatório para cadastrar veículo');
    }

    return customerId;
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
