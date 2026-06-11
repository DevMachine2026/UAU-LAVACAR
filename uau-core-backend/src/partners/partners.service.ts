import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { ListPartnersDto, PartnerStatusFilter } from './dto/list-partners.dto';
import { PartnerQrDto, PartnerTransactionDto } from './dto/partner-transaction.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePartnerDto) {
    return this.prisma.partner.create({
      data: createDto,
    });
  }

  async findAll(dto: ListPartnersDto) {
    const { page, limit, search, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.PartnerWhereInput = {
      ...(status !== undefined && { isActive: status === PartnerStatusFilter.ACTIVE }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        include: { state: true, city: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.partner.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        state: true,
        city: true,
      },
    });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    return partner;
  }

  async update(id: string, updateDto: UpdatePartnerDto) {
    return this.prisma.partner.update({
      where: { id },
      data: updateDto,
    }).catch(() => {
      throw new NotFoundException('Parceiro não encontrado');
    });
  }

  async activate(id: string) {
    return this.prisma.partner.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Parceiro não encontrado'); });
  }

  async deactivate(id: string) {
    return this.prisma.partner.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    }).catch(() => { throw new NotFoundException('Parceiro não encontrado'); });
  }

  // ── Partner Transactions ────────────────────────────────────────────────

  private async resolveCustomer(customerUserId?: string) {
    if (!customerUserId) return null;
    const customer = await this.prisma.customer.findFirst({
      where: { userId: customerUserId },
      include: { wallet: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  private calcTransaction(partner: { generatedCashbackPercent: any; customerCashbackPercent: any; uauCommissionPercent: any }, dto: PartnerTransactionDto) {
    const gross = Number(dto.grossAmount);
    const cashbackUsed = Math.min(Number(dto.cashbackToUse ?? 0), gross);
    const gatewayAmount = Math.max(0, gross - cashbackUsed);
    const generatedCashback = +(gross * Number(partner.generatedCashbackPercent) / 100).toFixed(2);
    const customerCashback = +(gross * Number(partner.customerCashbackPercent) / 100).toFixed(2);
    const uauCommission = +(gross * Number(partner.uauCommissionPercent) / 100).toFixed(2);
    return { gross, cashbackUsed, gatewayAmount, generatedCashback, customerCashback, uauCommission };
  }

  async previewTransaction(partnerId: string, dto: PartnerTransactionDto) {
    const partner = await this.findOne(partnerId);
    const calc = this.calcTransaction(partner, dto);
    return {
      grossAmount: calc.gross,
      cashbackUsed: calc.cashbackUsed,
      gatewayAmount: calc.gatewayAmount,
      generatedCashbackAmount: calc.generatedCashback,
      customerCashbackAmount: calc.customerCashback,
      uauCommissionAmount: calc.uauCommission,
      paymentMethod: dto.paymentMethod,
    };
  }

  async confirmTransaction(partnerId: string, dto: PartnerTransactionDto) {
    const partner = await this.findOne(partnerId);
    const calc = this.calcTransaction(partner, dto);
    const customer = await this.resolveCustomer(dto.customerUserId);

    if (!customer) throw new BadRequestException('customerUserId é obrigatório para confirmar transação');
    if (calc.cashbackUsed > Number(customer.wallet?.balance ?? 0)) {
      throw new BadRequestException('Saldo de cashback insuficiente');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.partnerTransaction.create({
        data: {
          partnerId,
          customerId: customer.id,
          grossAmount: calc.gross,
          cashbackUsed: calc.cashbackUsed,
          gatewayAmount: calc.gatewayAmount,
          generatedCashback: calc.generatedCashback,
          customerCashback: calc.customerCashback,
          uauCommission: calc.uauCommission,
          status: 'CONFIRMED',
          paymentMethod: dto.paymentMethod,
        },
      });

      if (customer.wallet && calc.cashbackUsed > 0) {
        await tx.wallet.update({
          where: { id: customer.wallet.id },
          data: { balance: { decrement: calc.cashbackUsed } },
        });
        await tx.walletMovement.create({
          data: {
            walletId: customer.wallet.id,
            type: 'DEBIT',
            origin: 'PARTNER_TRANSACTION',
            amount: calc.cashbackUsed,
            description: `Cashback usado em ${partner.name}`,
            referenceId: transaction.id,
          },
        });
      }

      if (customer.wallet && calc.customerCashback > 0) {
        await tx.wallet.update({
          where: { id: customer.wallet.id },
          data: { balance: { increment: calc.customerCashback } },
        });
        await tx.walletMovement.create({
          data: {
            walletId: customer.wallet.id,
            type: 'CREDIT',
            origin: 'PARTNER_TRANSACTION',
            amount: calc.customerCashback,
            description: `Cashback gerado em ${partner.name}`,
            referenceId: transaction.id,
          },
        });
      }

      return transaction;
    });
  }

  async createQr(partnerId: string, dto: PartnerQrDto) {
    const partner = await this.findOne(partnerId);
    const payload = Buffer.from(JSON.stringify({
      partnerId,
      partnerName: partner.name,
      grossAmount: dto.grossAmount,
      customerUserId: dto.customerUserId,
      generatedAt: new Date().toISOString(),
    })).toString('base64');

    return { qrCodePayload: payload };
  }
}
