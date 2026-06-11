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

    type NetworkRow = { id: string; name: string; createdAt: Date; line: number };

    // Single CTE — resolves all 3 lines in one query
    const rows = await this.prisma.$queryRaw<NetworkRow[]>`
      WITH
        line1 AS (
          SELECT u.id, u."name", u."createdAt", 1 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" = ${userId}
        ),
        line2 AS (
          SELECT u.id, u."name", u."createdAt", 2 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" IN (SELECT id FROM line1)
        ),
        line3 AS (
          SELECT u.id, u."name", u."createdAt", 3 AS line
          FROM referrals r
          JOIN users u ON u.id = r."referredId"
          WHERE r."referrerId" IN (SELECT id FROM line2)
        )
      SELECT * FROM line1
      UNION ALL
      SELECT * FROM line2
      UNION ALL
      SELECT * FROM line3
    `;

    const line1 = rows.filter(r => r.line === 1);
    const line2 = rows.filter(r => r.line === 2);
    const line3 = rows.filter(r => r.line === 3);

    const isQualified = line1.length >= 3;

    return {
      referralCode: customer.referralCode,
      isQualified,
      qualificationStatus: isQualified ? 'QUALIFIED' : 'PENDING',
      line1: line1.map(({ id, name, createdAt }) => ({ id, name, createdAt })),
      line2: line2.map(({ id, name, createdAt }) => ({ id, name, createdAt })),
      line3: line3.map(({ id, name, createdAt }) => ({ id, name, createdAt })),
      totals: {
        line1: line1.length,
        line2: line2.length,
        line3: line3.length,
        total: rows.length,
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
        FROM users u
        WHERE u.id = ${userId}

        UNION ALL

        SELECT
          u.id,
          u."name",
          CAST(t.depth + 1 AS INTEGER),
          r."referrerId" AS "parentId"
        FROM referrals r
        JOIN users u ON u.id = r."referredId"
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
