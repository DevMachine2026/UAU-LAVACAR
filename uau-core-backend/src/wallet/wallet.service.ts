import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WalletMovementOrigin, WalletMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { resolveBalanceUpdate } from './wallet-balance.util';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWalletForUser(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Carteira não encontrada para este cliente');

    const wallet = await this.getWallet(customer.id);
    return this.mapWalletForMobile(wallet);
  }

  async getStatementForUser(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Carteira não encontrada para este cliente');

    const wallet = await this.prisma.wallet.findUnique({
      where: { customerId: customer.id },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!wallet) throw new NotFoundException('Carteira não encontrada para este cliente');
    return wallet.movements;
  }

  async applyCashbackUsage(
    walletId: string,
    promotionalAmount: number,
    realAmount: number,
    referenceId?: string,
  ) {
    if (promotionalAmount <= 0 && realAmount <= 0) {
      return;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.applyCashbackUsageTx(tx, walletId, promotionalAmount, realAmount, referenceId);
    });
  }

  async applyCashbackUsageTx(
    tx: Prisma.TransactionClient,
    walletId: string,
    promotionalAmount: number,
    realAmount: number,
    referenceId?: string,
  ) {
    if (promotionalAmount <= 0 && realAmount <= 0) return;

    const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Carteira não encontrada');

    if (promotionalAmount > 0) {
      if (Number(wallet.promoBalance) < promotionalAmount) {
        throw new BadRequestException('Saldo promocional insuficiente');
      }
      await tx.walletMovement.create({
        data: {
          walletId,
          type: WalletMovementType.DEBIT,
          origin: WalletMovementOrigin.BILLING_DEDUCTION,
          amount: promotionalAmount,
          description: 'Cashback promocional aplicado na assinatura',
          referenceId,
        },
      });
      await tx.wallet.update({
        where: { id: walletId },
        data: { promoBalance: { decrement: promotionalAmount } },
      });
    }

    if (realAmount > 0) {
      if (Number(wallet.balance) < realAmount) {
        throw new BadRequestException('Saldo disponível insuficiente');
      }
      await tx.walletMovement.create({
        data: {
          walletId,
          type: WalletMovementType.DEBIT,
          origin: WalletMovementOrigin.BILLING_DEDUCTION,
          amount: realAmount,
          description: 'Cashback real aplicado na assinatura',
          referenceId,
        },
      });
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: realAmount } },
      });
    }
  }

  async getWallet(customerId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
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

      const balanceUpdate = resolveBalanceUpdate(
        wallet,
        createDto.type,
        createDto.origin,
        createDto.amount,
        createDto.description,
      );

      const movement = await tx.walletMovement.create({
        data: {
          walletId: createDto.walletId,
          type: createDto.type,
          origin: createDto.origin,
          amount: createDto.amount,
          description: createDto.description,
          referenceId: createDto.referenceId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: balanceUpdate,
      });

      return movement;
    });
  }

  private mapWalletForMobile(wallet: {
    balance: { toString(): string } | number | string;
    promoBalance: { toString(): string } | number | string;
    blockedBalance: { toString(): string } | number | string;
    [key: string]: unknown;
  }) {
    const balance = Number(wallet.balance);
    const promoBalance = Number(wallet.promoBalance);
    const blockedBalance = Number(wallet.blockedBalance);

    return {
      ...wallet,
      availableBalance: balance,
      promotionalBalance: promoBalance,
      blockedBalance,
      totalBalance: balance + promoBalance + blockedBalance,
    };
  }
}
