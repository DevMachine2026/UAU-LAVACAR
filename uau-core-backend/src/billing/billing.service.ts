import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
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

  async findOne(id: string, user?: User) {
    const billing = await this.prisma.billingHistory.findUnique({
      where: { id },
      include: { customer: true, subscription: true },
    });
    if (!billing) throw new NotFoundException('Fatura não encontrada');
    if (user?.role === UserRole.CUSTOMER && billing.customer?.userId !== user.id) {
      throw new ForbiddenException('Acesso negado');
    }
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
    const items = await this.prisma.billingHistory.findMany({
      where: { customerId: customer.id },
      include: { subscription: { include: { plan: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return items.map((item) => this.mapBillingForMobile(item));
  }

  async findCurrentByUserId(userId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { userId } });
    if (!customer) return null;

    const billing = await this.prisma.billingHistory.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return billing ? this.mapBillingForMobile(billing) : null;
  }

  private mapBillingForMobile(
    billing: {
      id: string;
      amount: { toString(): string } | number | string;
      status: string;
      asaasId: string | null;
      dueDate: Date | null;
      invoiceUrl: string | null;
      pixQrCode: string | null;
      pixCopyPaste: string | null;
      subscription?: { status: string; plan?: { name: string } | null } | null;
      [key: string]: unknown;
    },
  ) {
    const amount = Number(billing.amount);

    return {
      ...billing,
      amount,
      baseAmount: amount,
      totalAmount: amount,
      gatewayAmount: amount,
      asaasPayment: {
        id: billing.asaasId,
        status: billing.status,
        invoiceUrl: billing.invoiceUrl,
        pixQrCode: billing.pixQrCode,
        pixCopyPaste: billing.pixCopyPaste,
      },
    };
  }
}
