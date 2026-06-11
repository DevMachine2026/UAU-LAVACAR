import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { ListBillingDto } from './dto/list-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBillingDto) {
    return this.prisma.billingHistory.create({
      data: createDto,
    });
  }

  async findAll(dto: ListBillingDto, unitId?: string | null) {
    const { page, limit, customerId, startDate, endDate } = dto;
    const skip = (page - 1) * limit;

    const dueDateFilter: Prisma.DateTimeNullableFilter = {};
    if (startDate) dueDateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dueDateFilter.lte = end;
    }

    const where: Prisma.BillingHistoryWhereInput = {
      ...(customerId && { customerId }),
      ...(Object.keys(dueDateFilter).length > 0 && { dueDate: dueDateFilter }),
      ...(unitId && { customer: { attendances: { some: { shift: { unitId } } } } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.billingHistory.findMany({
        where,
        include: {
          customer: { select: { user: { select: { name: true } }, cpf: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billingHistory.count({ where }),
    ]);

    return paginate(data, total, page, limit);
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
