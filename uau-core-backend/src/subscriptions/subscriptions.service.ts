import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { AsaasService } from '../asaas/asaas.service';
import { AsaasBillingType, AsaasPaymentResponse, AsaasPixQrCodeResponse } from '../asaas/asaas.types';
import { paginate } from '../common/dto/pagination.dto';
import { resolvePlanAmount } from '../plans/plan-pricing.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

export type ResolvedAsaasData = {
  asaasCustomerId: string;
  asaasCustomerIsNew: boolean;
  asaasSubscriptionId: string;
  payment: AsaasPaymentResponse;
  pix: AsaasPixQrCodeResponse | null;
  billingType: AsaasBillingType;
  nextDueDate: string;
  recurringAmount: number;
  firstChargeAmount: number;
  planName: string;
};

export type CustomerForAsaas = {
  id: string;
  asaasCustomerId: string | null;
  cpf: string | null;
  phone: string | null;
  user: { name: string; email: string };
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  async create(createDto: CreateSubscriptionDto, user?: User) {
    const resolvedCustomerId = await this.resolveCustomerId(createDto.customerId, user);

    const customer = await this.prisma.customer.findUnique({
      where: { id: resolvedCustomerId },
      include: { user: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const plan = await this.prisma.plan.findUnique({
      where: { id: createDto.planId },
      include: { vehicleSizePrices: { where: { isActive: true } } },
    });
    if (!plan || !plan.isActive) throw new NotFoundException('Plano não encontrado ou inativo');

    const vehicle = createDto.vehicleId
      ? await this.prisma.vehicle.findFirst({
          where: { id: createDto.vehicleId, customerId: customer.id },
        })
      : null;
    if (createDto.vehicleId && !vehicle) {
      throw new NotFoundException('Veículo não encontrado para este cliente');
    }

    const recurringAmount =
      createDto.recurringAmount ?? (await resolvePlanAmount(this.prisma, plan, vehicle));
    const firstChargeAmount = createDto.firstChargeAmount ?? recurringAmount;

    if (firstChargeAmount <= 0) {
      throw new BadRequestException('Valor da cobrança inicial deve ser maior que zero');
    }

    // Step 1: HTTP calls — outside any DB transaction
    const asaasData = await this.resolveAsaasData(
      customer,
      { name: plan.name },
      createDto,
      firstChargeAmount,
      recurringAmount,
    );

    // Step 2: DB-only transaction
    return this.prisma.$transaction(async (tx) => {
      if (asaasData.asaasCustomerIsNew) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { asaasCustomerId: asaasData.asaasCustomerId },
        });
      }
      return this.createDbRecord(tx, resolvedCustomerId, plan.id, asaasData);
    });
  }

  /**
   * Executes all Asaas HTTP calls and returns the resolved data.
   * Must be called BEFORE any prisma.$transaction to keep HTTP outside DB locks.
   */
  async resolveAsaasData(
    customer: CustomerForAsaas,
    plan: { name: string },
    createDto: Pick<CreateSubscriptionDto, 'paymentMethodId' | 'vehicleId'>,
    firstChargeAmount: number,
    recurringAmount: number,
  ): Promise<ResolvedAsaasData> {
    const cpfCnpj = this.normalizeCpfCnpj(customer.cpf);
    if (!cpfCnpj) {
      throw new BadRequestException('CPF do cliente é obrigatório para gerar cobrança no Asaas');
    }

    let asaasCustomerId = customer.asaasCustomerId;
    let asaasCustomerIsNew = false;

    if (!asaasCustomerId) {
      const asaasCustomer = await this.asaasService.createCustomer({
        name: customer.user.name,
        email: customer.user.email,
        cpfCnpj,
        phone: customer.phone ?? undefined,
        mobilePhone: customer.phone ?? undefined,
      });
      asaasCustomerId = asaasCustomer.id;
      asaasCustomerIsNew = true;
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

    return {
      asaasCustomerId,
      asaasCustomerIsNew,
      asaasSubscriptionId: asaasSubscription.id,
      payment,
      pix,
      billingType,
      nextDueDate,
      recurringAmount,
      firstChargeAmount,
      planName: plan.name,
    };
  }

  /**
   * Creates subscription + billing DB records inside a provided transaction client.
   * Must be called INSIDE prisma.$transaction — no HTTP calls made here.
   */
  async createDbRecord(
    tx: Prisma.TransactionClient,
    customerId: string,
    planId: string,
    asaasData: ResolvedAsaasData,
  ) {
    const subscription = await tx.subscription.create({
      data: {
        customerId,
        planId,
        status: 'PENDING',
        asaasId: asaasData.asaasSubscriptionId,
      },
      include: {
        plan: true,
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    const billing = await tx.billingHistory.create({
      data: {
        customerId,
        subscriptionId: subscription.id,
        amount: asaasData.firstChargeAmount,
        status: 'PENDING',
        asaasId: asaasData.payment.id,
        dueDate: asaasData.payment.dueDate
          ? new Date(asaasData.payment.dueDate)
          : new Date(asaasData.nextDueDate),
        description: `Primeira cobrança — ${asaasData.planName}`,
        invoiceUrl: asaasData.payment.invoiceUrl ?? asaasData.payment.bankSlipUrl ?? null,
        pixQrCode: asaasData.pix?.encodedImage ?? null,
        pixCopyPaste: asaasData.pix?.payload ?? null,
        bankSlipBarCode: asaasData.payment.bankSlipBarCode ?? null,
      },
    });

    return {
      subscription,
      billing,
      payment: {
        asaasPaymentId: asaasData.payment.id,
        invoiceUrl: billing.invoiceUrl,
        pixQrCode: billing.pixQrCode,
        pixCopyPaste: billing.pixCopyPaste,
        bankSlipBarCode: billing.bankSlipBarCode,
        dueDate: asaasData.payment.dueDate ?? asaasData.nextDueDate,
        value: asaasData.firstChargeAmount,
        recurringAmount: asaasData.recurringAmount,
        billingType: asaasData.billingType,
      },
    };
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
