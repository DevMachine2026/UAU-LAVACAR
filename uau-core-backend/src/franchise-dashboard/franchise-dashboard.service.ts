import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FranchiseDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(unitId?: string) {
    const unitWhere = unitId ? { id: unitId } : {};
    const userUnitWhere = unitId ? { defaultUnitId: unitId } : {};

    const units = await this.prisma.franchiseUnit.findMany({
      where: { ...unitWhere, isActive: true },
      select: { id: true },
    });

    const [totalCustomers, activeSubscriptions, overdueSubscriptions] = await Promise.all([
      this.prisma.customer.count({ where: { user: userUnitWhere } }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', ...(unitId ? { customer: { user: { defaultUnitId: unitId } } } : {}) },
      }),
      this.prisma.subscription.count({
        where: { status: 'OVERDUE', ...(unitId ? { customer: { user: { defaultUnitId: unitId } } } : {}) },
      }),
    ]);

    return {
      totalUnits: units.length,
      totalCustomers,
      activeSubscriptions,
      overdueSubscriptions,
    };
  }

  async getFinancial(unitId?: string) {
    const unitFilter = unitId ? { defaultUnitId: unitId } : {};

    const [billingAgg, walletAgg, partnerAgg] = await Promise.all([
      this.prisma.billingHistory.aggregate({
        where: {
          status: 'PAID',
          ...(unitId ? { customer: { user: { defaultUnitId: unitId } } } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.walletMovement.aggregate({
        where: {
          type: 'DEBIT',
          origin: 'SUBSCRIPTION',
          ...(unitId ? { wallet: { customer: { user: unitFilter } } } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.financialLedger.aggregate({
        where: {
          type: 'CREDIT',
          origin: 'PARTNER_COMMISSION',
          ...(unitId ? { unitId } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      estimatedFranchiseRevenue: Number(billingAgg._sum.amount ?? 0) * 0.6,
      totalGatewayAmount: Number(billingAgg._sum.amount ?? 0),
      totalCashbackUsedInSubscriptions: Number(walletAgg._sum.amount ?? 0),
      totalPartnerUauCommission: Number(partnerAgg._sum.amount ?? 0),
    };
  }

  async getOperations(unitId?: string) {
    const shiftWhere = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openShifts, planToday, avulsoToday] = await Promise.all([
      this.prisma.shift.count({ where: { ...shiftWhere, status: 'OPEN' } }),
      this.prisma.attendance.count({
        where: {
          status: 'COMPLETED',
          type: 'MANUAL',
          createdAt: { gte: today },
          ...(unitId ? { shift: { unitId } } : {}),
        },
      }),
      this.prisma.attendance.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today },
          ...(unitId ? { shift: { unitId } } : {}),
        },
      }),
    ]);

    return {
      openShifts,
      totalAttendancesToday: planToday + avulsoToday,
      totalPlanAttendancesToday: planToday,
      totalAvulsoAttendancesToday: avulsoToday,
    };
  }

  async getAlerts(unitId?: string) {
    const [overdueCount] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          status: 'OVERDUE',
          ...(unitId ? { customer: { user: { defaultUnitId: unitId } } } : {}),
        },
      }),
    ]);

    const alerts: string[] = [];
    if (overdueCount > 0) alerts.push(`${overdueCount} assinatura(s) em atraso`);
    return alerts;
  }

  async getAnpr(unitId?: string) {
    const anprWhere = unitId ? { unitId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, authorized, blocked] = await Promise.all([
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today } } }),
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today }, status: 'AUTHORIZED' } }),
      this.prisma.anprEvent.count({ where: { ...anprWhere, capturedAt: { gte: today }, status: 'BLOCKED' } }),
    ]);
    return { totalEvents: total, authorized, blocked };
  }

  async getCustomers(filters?: { unitId?: string; name?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.unitId || filters?.status || filters?.name) {
      where.user = {
        ...(filters.unitId ? { defaultUnitId: filters.unitId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {}),
      };
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, defaultUnit: { select: { id: true, name: true } } } },
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

  async getPartners(user: User) {
    if (user.role === UserRole.FRANCHISE_OWNER && !user.defaultUnitId) {
      throw new ForbiddenException('Usuário sem unidade padrão atribuída');
    }

    const where =
      user.role === UserRole.FRANCHISE_OWNER
        ? { unitId: user.defaultUnitId, isActive: true }
        : { isActive: true };

    return this.prisma.partner.findMany({
      where,
      include: {
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
