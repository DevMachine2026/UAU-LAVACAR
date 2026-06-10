import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerDashboardService {
  constructor(private prisma: PrismaService) {}

  private async resolvePartnerId(user: User): Promise<string | null> {
    if (user.role !== UserRole.PARTNER) return null;
    const partner = await this.prisma.partner.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true },
    });
    if (!partner) throw new ForbiddenException('Parceiro não encontrado para este usuário');
    return partner.id;
  }

  async getOverview(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    const [activePartners, totalTransactions, customersServed] = await Promise.all([
      this.prisma.partner.count({ where: { isActive: true, ...partnerFilter } }),
      this.prisma.financialLedger.count({ where: { origin: 'PARTNER_TRANSACTION', ...partnerFilter } }),
      this.prisma.partnerTransaction.count({ where: partnerId ? { partnerId } : {} }),
    ]);

    return {
      activePartners,
      totalTransactions,
      totalCustomersServed: customersServed,
      averageTicket: 0,
      totalGrossSales: 0,
      totalCashbackUsed: 0,
    };
  }

  async getFinancial(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    const [ledgerAgg, txAgg] = await Promise.all([
      this.prisma.financialLedger.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'CREDIT', ...partnerFilter },
        _sum: { amount: true },
      }),
      this.prisma.partnerTransaction.aggregate({
        where: partnerId ? { partnerId } : {},
        _sum: { cashbackUsed: true },
      }),
    ]);

    return {
      grossSales: 0,
      gatewayAmount: 0,
      cashbackAcceptedAsDiscount: Number(txAgg._sum.cashbackUsed ?? 0),
      cashbackGenerated: 0,
      uauCommissionAmount: Number(ledgerAgg._sum.amount ?? 0),
    };
  }

  async getTransactions(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const partnerFilter = partnerId ? { partnerId } : {};

    return this.prisma.financialLedger.findMany({
      where: { origin: 'PARTNER_TRANSACTION', ...partnerFilter },
      include: { partner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlerts(user: User) {
    await this.resolvePartnerId(user);
    const alerts: string[] = [];
    return alerts;
  }

  async getCampaigns(user: User) {
    const partnerId = await this.resolvePartnerId(user);
    const now = new Date();

    return this.prisma.campaign.findMany({
      where: {
        ...(partnerId ? { partnerId } : {}),
        isActive: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomers(user: User) {
    const partnerId = await this.resolvePartnerId(user);

    const txRows = await this.prisma.partnerTransaction.findMany({
      where: partnerId ? { partnerId } : {},
      select: { customerId: true },
      distinct: ['customerId'],
    });

    const customerIds = txRows.map((r) => r.customerId);

    return this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
