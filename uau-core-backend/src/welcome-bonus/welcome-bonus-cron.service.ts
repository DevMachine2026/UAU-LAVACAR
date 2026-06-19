import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalletMovementOrigin, WalletMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';

// Fortaleza é UTC-3 sem horário de verão
function daysBetweenFortaleza(from: Date, to: Date): number {
  const FORTALEZA_OFFSET_MS = -3 * 60 * 60 * 1000;
  const fromLocal = new Date(from.getTime() + FORTALEZA_OFFSET_MS);
  const toLocal = new Date(to.getTime() + FORTALEZA_OFFSET_MS);
  const fromMidnight = Date.UTC(fromLocal.getUTCFullYear(), fromLocal.getUTCMonth(), fromLocal.getUTCDate());
  const toMidnight = Date.UTC(toLocal.getUTCFullYear(), toLocal.getUTCMonth(), toLocal.getUTCDate());
  return Math.floor((toMidnight - fromMidnight) / (86_400 * 1000));
}

@Injectable()
export class WelcomeBonusCronService {
  private readonly logger = new Logger(WelcomeBonusCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminSettings: AdminSettingsService,
  ) {}

  @Cron('0 0 * * *', { timeZone: 'America/Fortaleza' })
  async handleDailyDecay() {
    const [bonusAmountStr, decayAmountStr] = await Promise.all([
      this.adminSettings.getCached('WELCOME_BONUS_AMOUNT'),
      this.adminSettings.getCached('WELCOME_BONUS_DAILY_DECAY'),
    ]);
    const bonusAmount = Number(bonusAmountStr);
    const decayAmount = Number(decayAmountStr);

    const grants = await this.prisma.welcomeBonusGrant.findMany({
      where: { fullyExpiredAt: null },
      include: { wallet: true },
    });

    const now = new Date();
    let processed = 0;
    let decayed = 0;
    let zeroed = 0;
    let skipped = 0;

    for (const grant of grants) {
      const daysElapsed = daysBetweenFortaleza(grant.grantedAt, now);
      const expectedBalance = Math.max(0, bonusAmount - daysElapsed * decayAmount);
      const currentBalance = Number(grant.wallet.welcomeBonusBalance);

      if (expectedBalance === 0 && currentBalance === 0) {
        // Caso g: já zerado pelo cliente, apenas marca como expirado
        await this.prisma.welcomeBonusGrant.update({
          where: { id: grant.id },
          data: { fullyExpiredAt: now },
        });
        zeroed++;
      } else if (expectedBalance >= currentBalance) {
        // Cliente já gastou mais que o teto de decaimento — não reduz
        skipped++;
      } else {
        // Caso normal de decaimento: expectedBalance < currentBalance
        const delta = currentBalance - expectedBalance;

        await this.prisma.$transaction(async (tx) => {
          await tx.walletMovement.create({
            data: {
              walletId: grant.walletId,
              type: WalletMovementType.EXPIRY,
              origin: WalletMovementOrigin.WELCOME_BONUS,
              amount: delta,
              description: `Decaimento diário do bônus de boas-vindas (dia ${daysElapsed})`,
              referenceId: grant.id,
            },
          });

          await tx.wallet.update({
            where: { id: grant.walletId },
            data: { welcomeBonusBalance: { decrement: delta } },
          });

          if (expectedBalance === 0) {
            // Caso f: zera completamente e marca como expirado
            await tx.welcomeBonusGrant.update({
              where: { id: grant.id },
              data: { fullyExpiredAt: now },
            });
          }
        });

        decayed++;
        if (expectedBalance === 0) zeroed++;
      }

      processed++;
    }

    this.logger.log(
      `Decaimento diário: ${processed} grants processados, ${decayed} decaíram, ${zeroed} zeraram, ${skipped} pulados`,
    );
  }
}
