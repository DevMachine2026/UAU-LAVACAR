import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { UpdateFranchiseRuleDto } from './dto/update-franchise-rule.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ==================== LEDGER (Livro Razão) ====================

  async createLedgerEntry(createDto: CreateLedgerEntryDto) {
    return this.prisma.financialLedger.create({
      data: createDto,
    });
  }

  async getLedgerByUnit(unitId: string) {
    return this.prisma.financialLedger.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ==================== FRANCHISE RULES ====================

  async getFranchiseRule(unitId: string) {
    let rule = await this.prisma.franchiseRule.findUnique({
      where: { unitId },
    });

    if (!rule) {
      // Cria a regra padrão se não existir
      rule = await this.prisma.franchiseRule.create({
        data: {
          unitId,
          repassePercent: 60.0,
          royaltyPercent: 10.0,
          marketingPercent: 5.0,
        },
      });
    }

    return rule;
  }

  async updateFranchiseRule(unitId: string, updateDto: UpdateFranchiseRuleDto) {
    return this.prisma.franchiseRule.upsert({
      where: { unitId },
      update: updateDto,
      create: {
        unitId,
        repassePercent: updateDto.repassePercent || 0,
        royaltyPercent: updateDto.royaltyPercent || 0,
        marketingPercent: updateDto.marketingPercent || 0,
      },
    });
  }

  // ==================== OVERVIEW & REPORTS ====================

  async getFinancialOverview(unitId?: string) {
    // Exemplo de agregação para relatórios
    // Isso futuramente seria uma query agregada de receitas x despesas
    const whereClause = unitId ? { unitId } : {};

    const credits = await this.prisma.financialLedger.aggregate({
      where: { ...whereClause, type: 'CREDIT' },
      _sum: { amount: true },
    });

    const debits = await this.prisma.financialLedger.aggregate({
      where: { ...whereClause, type: 'DEBIT' },
      _sum: { amount: true },
    });

    return {
      totalCredits: credits._sum.amount || 0,
      totalDebits: debits._sum.amount || 0,
      balance: Number(credits._sum.amount || 0) - Number(debits._sum.amount || 0),
    };
  }
}
