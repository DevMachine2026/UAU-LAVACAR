import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [activePartners, totalTransactions, customersServed] = await Promise.all([
      this.prisma.partner.count({ where: { isActive: true } }),
      this.prisma.financialLedger.count({ where: { origin: 'PARTNER_TRANSACTION' } }),
      this.prisma.walletMovement.count({ where: { origin: 'PARTNER_TRANSACTION' } }),
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

  async getFinancial() {
    const [ledgerAgg, cashbackAgg] = await Promise.all([
      this.prisma.financialLedger.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'CREDIT' },
        _sum: { amount: true },
      }),
      this.prisma.walletMovement.aggregate({
        where: { origin: 'PARTNER_TRANSACTION', type: 'DEBIT' },
        _sum: { amount: true },
      }),
    ]);

    return {
      grossSales: 0,
      gatewayAmount: 0,
      cashbackAcceptedAsDiscount: Number(cashbackAgg._sum.amount ?? 0),
      cashbackGenerated: 0,
      uauCommissionAmount: Number(ledgerAgg._sum.amount ?? 0),
    };
  }

  async getTransactions() {
    return this.prisma.financialLedger.findMany({
      where: { origin: 'PARTNER_TRANSACTION' },
      include: { partner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlerts() {
    const alerts: string[] = [];
    return alerts;
  }
}
