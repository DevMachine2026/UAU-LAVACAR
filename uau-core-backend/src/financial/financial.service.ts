// uau-core-backend/src/financial/financial.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { WalletMovementType } from '@prisma/client';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ===== LEDGER =====

  async createLedgerEntry(dto: CreateLedgerEntryDto) {
    return this.prisma.financialLedger.create({ data: dto });
  }

  async getLedger(filters?: {
    unitId?: string;
    userId?: string;
    partnerId?: string;
    type?: string;
    source?: string;
    page?: number;
    limit?: number;
  }) {
    const take = Math.min(filters?.limit ?? 50, 200);
    const skip = ((filters?.page ?? 1) - 1) * take;
    const where: Record<string, unknown> = {};
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.partnerId) where.partnerId = filters.partnerId;
    if (filters?.type) where.type = filters.type;

    const [items, total] = await Promise.all([
      this.prisma.financialLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.financialLedger.count({ where }),
    ]);

    return { items, total, page: filters?.page ?? 1, limit: take };
  }

  async getLedgerByUnit(unitId: string) {
    return this.prisma.financialLedger.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ===== FRANCHISE RULES =====

  async getAllFranchiseRules() {
    const rules = await this.prisma.franchiseRule.findMany({
      include: { unit: { select: { id: true, name: true } } },
    });
    return rules.map((r) => this.mapRule(r));
  }

  async getFranchiseRule(unitId: string) {
    let rule = await this.prisma.franchiseRule.findUnique({
      where: { unitId },
      include: { unit: { select: { id: true, name: true } } },
    });
    if (!rule) {
      rule = await this.prisma.franchiseRule.create({
        data: { unitId, repassePercent: 60.0, royaltyPercent: 10.0, marketingPercent: 5.0 },
        include: { unit: { select: { id: true, name: true } } },
      });
    }
    return this.mapRule(rule);
  }

  async createFranchiseRule(dto: UpdateFranchiseRuleDto & { unitId: string }) {
    const data = this.mapRuleDto(dto);
    const rule = await this.prisma.franchiseRule.upsert({
      where: { unitId: dto.unitId },
      update: data,
      create: { unitId: dto.unitId, ...data },
      include: { unit: { select: { id: true, name: true } } },
    });
    return this.mapRule(rule);
  }

  async updateFranchiseRuleById(id: string, dto: UpdateFranchiseRuleDto) {
    const rule = await this.prisma.franchiseRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    const updated = await this.prisma.franchiseRule.update({
      where: { id },
      data: this.mapRuleDto(dto),
      include: { unit: { select: { id: true, name: true } } },
    });
    return this.mapRule(updated);
  }

  async updateFranchiseRule(unitId: string, dto: UpdateFranchiseRuleDto) {
    return this.prisma.franchiseRule.upsert({
      where: { unitId },
      update: this.mapRuleDto(dto),
      create: { unitId, ...this.mapRuleDto(dto) },
    });
  }

  private mapRuleDto(dto: UpdateFranchiseRuleDto) {
    return {
      repassePercent: dto.franchiseRevenuePercent ?? dto.repassePercent ?? 0,
      royaltyPercent: dto.uauRoyaltyPercent ?? dto.royaltyPercent ?? 0,
      marketingPercent: dto.marketingFundPercent ?? dto.marketingPercent ?? 0,
    };
  }

  private mapRule(rule: {
    id: string;
    unitId: string;
    repassePercent: unknown;
    royaltyPercent: unknown;
    marketingPercent: unknown;
    [key: string]: unknown;
  }) {
    return {
      id: rule.id,
      unitId: rule.unitId,
      franchiseRevenuePercent: Number(rule.repassePercent),
      uauRoyaltyPercent: Number(rule.royaltyPercent),
      marketingFundPercent: Number(rule.marketingPercent),
      unit: rule.unit,
      updatedAt: rule.updatedAt,
    };
  }

  // ===== REPORTS =====

  async getFranchiseReports() {
    return this.prisma.franchiseReport.findMany({
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateFranchiseReport(dto: GenerateReportDto) {
    const period = `${dto.periodStart}_${dto.periodEnd}`;
    return this.prisma.franchiseReport.create({
      data: {
        unitId: dto.unitId,
        period,
        status: 'OPEN',
        data: { periodStart: dto.periodStart, periodEnd: dto.periodEnd },
      },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  async closeFranchiseReport(id: string) {
    const report = await this.prisma.franchiseReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    return this.prisma.franchiseReport.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  // ===== OVERVIEW & FLOAT =====

  async getFinancialOverview(unitId?: string) {
    const where = unitId ? { unitId } : {};
    const [credits, debits, walletAgg, cashbackIssued, cashbackUsed] = await Promise.all([
      this.prisma.financialLedger.aggregate({ where: { ...where, type: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.financialLedger.aggregate({ where: { ...where, type: 'DEBIT' }, _sum: { amount: true } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true, promoBalance: true, blockedBalance: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: WalletMovementType.CREDIT }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: WalletMovementType.DEBIT }, _sum: { amount: true } }),
    ]);

    return {
      totalCredits: Number(credits._sum.amount ?? 0),
      totalDebits: Number(debits._sum.amount ?? 0),
      balance: Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0),
      totalCashbackInCirculation: Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalCashbackIssued: Number(cashbackIssued._sum.amount ?? 0),
      totalCashbackUsed: Number(cashbackUsed._sum.amount ?? 0),
    };
  }

  async getFinancialFloat() {
    const walletAgg = await this.prisma.wallet.aggregate({
      _sum: { balance: true, promoBalance: true, blockedBalance: true },
    });
    const [issued, used, expired] = await Promise.all([
      this.prisma.walletMovement.aggregate({ where: { type: WalletMovementType.CREDIT }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: WalletMovementType.DEBIT }, _sum: { amount: true } }),
      this.prisma.walletMovement.aggregate({ where: { type: WalletMovementType.EXPIRY }, _sum: { amount: true } }),
    ]);

    return {
      totalAvailableBalance: Number(walletAgg._sum.balance ?? 0),
      totalPromotionalBalance: Number(walletAgg._sum.promoBalance ?? 0),
      totalBlockedBalance: Number(walletAgg._sum.blockedBalance ?? 0),
      totalCashbackInCirculation:
        Number(walletAgg._sum.balance ?? 0) + Number(walletAgg._sum.promoBalance ?? 0),
      totalCashbackIssued: Number(issued._sum.amount ?? 0),
      totalCashbackUsed: Number(used._sum.amount ?? 0),
      totalCashbackExpired: Number(expired._sum.amount ?? 0),
    };
  }
}
