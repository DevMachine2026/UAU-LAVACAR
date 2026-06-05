import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async getMe(user: User) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        defaultUnitId: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            cpf: true,
            phone: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const wallet =
      profile.role === UserRole.CUSTOMER
        ? await this.walletService.getWalletForUser(user.id).catch(() => null)
        : null;

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      defaultUnitId: profile.defaultUnitId,
      phone: profile.customer?.phone ?? null,
      cpf: profile.customer?.cpf ?? null,
      customerId: profile.customer?.id ?? null,
      wallet,
    };
  }
}
