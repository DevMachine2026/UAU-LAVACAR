import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBillingDto) {
    return this.prisma.billingHistory.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.billingHistory.findMany({
      include: {
        customer: { select: { user: { select: { name: true } }, cpf: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const billing = await this.prisma.billingHistory.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: true,
      },
    });
    if (!billing) throw new NotFoundException('Fatura não encontrada');
    return billing;
  }

  async update(id: string, updateDto: UpdateBillingDto) {
    return this.prisma.billingHistory.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Fatura não encontrada');
    });
  }

  async findByCustomer(userId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { userId } });
    if (!customer) return [];
    return this.prisma.billingHistory.findMany({
      where: { customerId: customer.id },
      include: { subscription: { include: { plan: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
