import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalCustomers, totalPartners, totalUnits, activeSubscriptions, openBillingCycles, totalUsers] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.partner.count({ where: { isActive: true } }),
        this.prisma.franchiseUnit.count({ where: { isActive: true } }),
        this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        this.prisma.billingHistory.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
        this.prisma.user.count(),
      ]);

    return { totalUsers, totalCustomers, totalPartners, totalUnits, activeSubscriptions, openBillingCycles };
  }

  async getFinancial() {
    const [billingAgg, walletAgg, partnerLedger] = await Promise.all([
      this.prisma.billingHistory.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true, promoBalance: true } }),
      this.prisma.financialLedger.aggregate({ where: { type: 'CREDIT', origin: 'PARTNER_COMMISSION' }, _sum: { amount: true } }),
    ]);

    return {
      totalGatewayAmount: Number(billingAgg._sum.amount ?? 0),
      totalCashbackInCirculation:
        Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalWalletAvailableBalance: Number(walletAgg._sum.balance ?? 0),
      totalPartnerUauCommission: Number(partnerLedger._sum.amount ?? 0),
    };
  }

  async getAlerts() {
    const [overdueSubscriptions, openFlags, suspectUsers] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'OVERDUE' } }),
      this.prisma.antiFraudFlag.count({ where: { status: 'OPEN', severity: { in: ['HIGH', 'CRITICAL'] } } }),
      this.prisma.user.count({ where: { status: 'SUSPECT' } }),
    ]);

    const alerts: string[] = [];
    if (overdueSubscriptions > 0) alerts.push(`${overdueSubscriptions} assinatura(s) em atraso`);
    if (openFlags > 0) alerts.push(`${openFlags} flag(s) de fraude crítica/alta em aberto`);
    if (suspectUsers > 0) alerts.push(`${suspectUsers} usuário(s) suspeito(s)`);

    return alerts;
  }

  async getOperations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [openShifts, washesToday] = await Promise.all([
      this.prisma.shift.count({ where: { status: 'OPEN' } }),
      this.prisma.attendance.count({
        where: { status: 'COMPLETED', createdAt: { gte: today } },
      }),
    ]);
    return { openShifts, totalWashesToday: washesToday };
  }

  async getAnpr() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, authorized, blocked] = await Promise.all([
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today } } }),
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today }, status: 'AUTHORIZED' } }),
      this.prisma.anprEvent.count({ where: { capturedAt: { gte: today }, status: 'BLOCKED' } }),
    ]);
    return { totalEvents: total, authorized, blocked };
  }
}
