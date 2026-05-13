import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(customerId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Últimos 20 movimentos
        },
      },
    });

    if (!wallet) throw new NotFoundException('Carteira não encontrada para este cliente');
    return wallet;
  }

  async addMovement(createDto: CreateMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: createDto.walletId },
      });

      if (!wallet) throw new NotFoundException('Carteira não encontrada');

      // Cria a movimentação
      const movement = await tx.walletMovement.create({
        data: createDto,
      });

      // Atualiza o saldo principal ou promocional
      // TODO: Logica detalhada baseada no tipo (CREDIT/DEBIT) e origem (Cashback promocional vs Saldo real)
      const incrementValue = createDto.type === 'CREDIT' ? createDto.amount : -createDto.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: incrementValue } },
      });

      return movement;
    });
  }
}
