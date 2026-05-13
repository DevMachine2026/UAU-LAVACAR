import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralDto } from './dto/create-referral.dto';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async createReferral(createDto: CreateReferralDto) {
    // 1. Verifica se quem está sendo indicado já foi indicado por alguém
    const existingReferral = await this.prisma.referral.findUnique({
      where: { referredId: createDto.referredId },
    });

    if (existingReferral) {
      throw new ConflictException('Este usuário já foi indicado por outra pessoa');
    }

    // 2. Cria a relação de indicação
    const referral = await this.prisma.referral.create({
      data: createDto,
    });

    // 3. (OPCIONAL/FUTURO) Gera cashback automático para o indicador (referrer)
    // E/OU para o indicado (referred) na wallet.

    return referral;
  }

  async getReferralSummary(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const referralsMade = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: { select: { id: true, name: true, createdAt: true } },
      },
    });

    const referralReceived = await this.prisma.referral.findUnique({
      where: { referredId: userId },
      include: {
        referrer: { select: { id: true, name: true } },
      },
    });

    return {
      totalIndications: referralsMade.length,
      indicatedBy: referralReceived ? referralReceived.referrer : null,
      referrals: referralsMade.map(r => r.referred),
    };
  }
}
