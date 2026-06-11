import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralDto } from './dto/create-referral.dto';

const MAX_TREE_DEPTH = 10;

type TreeRow = {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
};

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async createReferral(createDto: CreateReferralDto) {
    const existingReferral = await this.prisma.referral.findUnique({
      where: { referredId: createDto.referredId },
    });
    if (existingReferral) {
      throw new ConflictException('Este usuário já foi indicado por outra pessoa');
    }
    return this.prisma.referral.create({ data: createDto });
  }

  async getReferralSummary(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const referralsMade = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referred: { select: { id: true, name: true, createdAt: true } } },
    });
    const referralReceived = await this.prisma.referral.findUnique({
      where: { referredId: userId },
      include: { referrer: { select: { id: true, name: true } } },
    });

    return {
      totalIndications: referralsMade.length,
      indicatedBy: referralReceived ? referralReceived.referrer : null,
      referrals: referralsMade.map(r => r.referred),
    };
  }

  async getMyNetwork(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      select: { id: true, referralCode: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    // Linha 1: indicados diretamente por este usuário
    const line1Refs = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    // Linha 2: indicados pelos da linha 1
    const line1Ids = line1Refs.map(r => r.referredId);
    const line2Refs = line1Ids.length > 0
      ? await this.prisma.referral.findMany({
          where: { referrerId: { in: line1Ids } },
          include: { referred: { select: { id: true, name: true, createdAt: true } } },
        })
      : [];

    // Linha 3: indicados pelos da linha 2
    const line2Ids = line2Refs.map(r => r.referredId);
    const line3Refs = line2Ids.length > 0
      ? await this.prisma.referral.findMany({
          where: { referrerId: { in: line2Ids } },
          include: { referred: { select: { id: true, name: true, createdAt: true } } },
        })
      : [];

    const isQualified = line1Refs.length >= 3;

    return {
      referralCode: customer.referralCode,
      isQualified,
      qualificationStatus: isQualified ? 'QUALIFIED' : 'PENDING',
      line1: line1Refs.map(r => r.referred),
      line2: line2Refs.map(r => r.referred),
      line3: line3Refs.map(r => r.referred),
      totals: {
        line1: line1Refs.length,
        line2: line2Refs.length,
        line3: line3Refs.length,
        total: line1Refs.length + line2Refs.length + line3Refs.length,
      },
    };
  }

  async getMyTree(userId: string): Promise<object> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Single recursive CTE query — replaces the previous N+1 buildTree recursion
    const rows = await this.prisma.$queryRaw<TreeRow[]>`
      WITH RECURSIVE tree AS (
        SELECT
          u.id,
          u."name",
          CAST(0 AS INTEGER)  AS depth,
          NULL::text          AS "parentId"
        FROM "User" u
        WHERE u.id = ${userId}

        UNION ALL

        SELECT
          u.id,
          u."name",
          CAST(t.depth + 1 AS INTEGER),
          r."referrerId" AS "parentId"
        FROM referrals r
        JOIN "User" u ON u.id = r."referredId"
        JOIN tree    t ON r."referrerId" = t.id
        WHERE t.depth < ${MAX_TREE_DEPTH}
      )
      SELECT id, "name", depth, "parentId" FROM tree
    `;

    return this.assembleTree(rows, userId);
  }

  private assembleTree(rows: TreeRow[], rootId: string): object {
    const map = new Map<string, { id: string; name: string; children: object[] }>();

    for (const row of rows) {
      map.set(row.id, { id: row.id, name: row.name, children: [] });
    }

    for (const row of rows) {
      if (row.parentId !== null) {
        map.get(row.parentId)?.children.push(map.get(row.id)!);
      }
    }

    return map.get(rootId) ?? { id: rootId, name: '', children: [] };
  }
}
