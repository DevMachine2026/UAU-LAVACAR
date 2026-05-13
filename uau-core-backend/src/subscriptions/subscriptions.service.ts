import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSubscriptionDto) {
    // A integração real com o Asaas entrará aqui no futuro
    return this.prisma.subscription.create({
      data: {
        customerId: createDto.customerId,
        planId: createDto.planId,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.subscription.findMany({
      include: {
        customer: { select: { user: { select: { name: true } }, cpf: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { user: { select: { name: true, email: true } }, cpf: true, phone: true } },
        plan: true,
        billingHistory: { orderBy: { dueDate: 'desc' } },
      },
    });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    return subscription;
  }

  async update(id: string, updateDto: UpdateSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Assinatura não encontrada');
    });
  }
}
