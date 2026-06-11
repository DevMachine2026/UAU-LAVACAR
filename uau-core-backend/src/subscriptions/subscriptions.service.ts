import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { AsaasService } from '../asaas/asaas.service';
import { AsaasBillingType } from '../asaas/asaas.types';
import { paginate } from '../common/dto/pagination.dto';
import { resolvePlanAmount } from '../plans/plan-pricing.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  async create(createDto: CreateSubscriptionDto, user?: User) {
    const resolvedCustomerId = await this.resolveCustomerId(createDto.customerId, user);

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: resolvedCustomerId },
        include: { user: true },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const plan = await tx.plan.findUnique({
        where: { id: createDto.planId },
        include: { vehicleSizePrices: { where: { isActive: true } } },
      });

      if (!plan || !plan.isActive) {
        throw new NotFoundException('Plano não encontrado ou inativo');
      }

      const vehicle = createDto.vehicleId
        ? await tx.vehicle.findFirst({
            where: { id: createDto.vehicleId, customerId: customer.id },
          })
        : null;

      if (createDto.vehicleId && !vehicle) {
        throw new NotFoundException('Veículo não encontrado para este cliente');
      }

      const recurringAmount =
        createDto.recurringAmount ??
        (await resolvePlanAmount(tx, plan, vehicle));
      const firstChargeAmount = createDto.firstChargeAmount ?? recurringAmount;

      if (firstChargeAmount <= 0) {
        throw new BadRequestException('Valor da cobrança inicial deve ser maior que zero');
      }

      const cpfCnpj = this.normalizeCpfCnpj(customer.cpf);
      if (!cpfCnpj) {
        throw new BadRequestException('CPF do cliente é obrigatório para gerar cobrança no Asaas');
      }

      let asaasCustomerId = customer.asaasCustomerId;
      if (!asaasCustomerId) {
        const asaasCustomer = await this.asaasService.createCustomer({
          name: customer.user.name,
          email: customer.user.email,
          cpfCnpj,
          phone: customer.phone ?? undefined,
          mobilePhone: customer.phone ?? undefined,
        });
        asaasCustomerId = asaasCustomer.id;
        await tx.customer.update({
          where: { id: customer.id },
          data: { asaasCustomerId },
        });
      }

      const billingType = this.resolveBillingType(createDto.paymentMethodId);
      const nextDueDate = this.formatAsaasDate(new Date());

      const asaasSubscription = await this.asaasService.createSubscription({
        customer: asaasCustomerId,
        billingType,
        value: recurringAmount,
        nextDueDate,
        cycle: 'MONTHLY',
        description: `Assinatura UAU+ — ${plan.name}`,
        externalReference: customer.id,
      });

      const payment = await this.asaasService.resolveFirstSubscriptionPayment(
        asaasSubscription.id,
        {
          customer: asaasCustomerId,
          billingType,
          value: firstChargeAmount,
          dueDate: nextDueDate,
          description: `Primeira cobrança — ${plan.name}`,
          externalReference: customer.id,
        },
      );

      const pix =
        billingType === 'PIX' && payment.id
          ? await this.asaasService.getPaymentPixQrCode(payment.id)
          : null;

      const subscription = await tx.subscription.create({
        data: {
          customerId: resolvedCustomerId,
          planId: createDto.planId,
          status: 'PENDING',
          asaasId: asaasSubscription.id,
        },
        include: {
          plan: true,
          customer: { include: { user: { select: { name: true, email: true } } } },
        },
      });

      const billing = await tx.billingHistory.create({
        data: {
          customerId: resolvedCustomerId,
          subscriptionId: subscription.id,
          amount: firstChargeAmount,
          status: 'PENDING',
          asaasId: payment.id,
          dueDate: payment.dueDate ? new Date(payment.dueDate) : new Date(nextDueDate),
          description: `Primeira cobrança — ${plan.name}`,
          invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
          pixQrCode: pix?.encodedImage ?? null,
          pixCopyPaste: pix?.payload ?? null,
          bankSlipBarCode: payment.bankSlipBarCode ?? null,
        },
      });

      return {
        subscription,
        billing,
        payment: {
          asaasPaymentId: payment.id,
          invoiceUrl: billing.invoiceUrl,
          pixQrCode: billing.pixQrCode,
          pixCopyPaste: billing.pixCopyPaste,
          bankSlipBarCode: billing.bankSlipBarCode,
          dueDate: payment.dueDate ?? nextDueDate,
          value: firstChargeAmount,
          recurringAmount,
          billingType,
        },
      };
    });
  }

  async findAll(dto: ListSubscriptionsDto) {
    const { page, limit, customerId, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {
      ...(customerId && { customerId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          customer: { select: { user: { select: { name: true } }, cpf: true } },
          plan: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, user?: User) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { userId: true, user: { select: { name: true, email: true } }, cpf: true, phone: true } },
        plan: true,
        billingHistory: { orderBy: { dueDate: 'desc' } },
      },
    });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    if (user?.role === UserRole.CUSTOMER && subscription.customer?.userId !== user.id) {
      throw new ForbiddenException('Acesso negado');
    }
    return subscription;
  }

  async update(id: string, updateDto: UpdateSubscriptionDto) {
    return this.prisma.subscription
      .update({
        where: { id },
        data: updateDto,
      })
      .catch(() => {
        throw new NotFoundException('Assinatura não encontrada');
      });
  }

  private async resolveCustomerId(customerId: string, user?: User): Promise<string> {
    if (user?.role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!customer) throw new NotFoundException('Cliente não encontrado para este usuário');
      return customer.id;
    }
    return customerId;
  }

  private resolveBillingType(paymentMethodId?: string): AsaasBillingType {
    const method = (paymentMethodId ?? 'PIX').toUpperCase();
    if (method === 'CREDIT_CARD' || method === 'CARD') return 'CREDIT_CARD';
    if (method === 'BOLETO' || method === 'BANK_SLIP') return 'BOLETO';
    return 'PIX';
  }

  private normalizeCpfCnpj(cpf?: string | null): string | null {
    if (!cpf) return null;
    const digits = cpf.replace(/\D/g, '');
    return digits.length >= 11 ? digits : null;
  }

  private formatAsaasDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
