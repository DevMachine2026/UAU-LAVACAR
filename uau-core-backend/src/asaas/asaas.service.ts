import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PlanPeriodicity, WalletMovementOrigin, WalletMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import {
  AsaasBillingType,
  AsaasCustomerPayload,
  AsaasCustomerResponse,
  AsaasListResponse,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasSubscriptionPayload,
  AsaasSubscriptionResponse,
} from './asaas.types';

function calculateExpiresAt(startedAt: Date, periodicity: PlanPeriodicity): Date {
  const result = new Date(startedAt);
  switch (periodicity) {
    case 'MONTHLY':      result.setMonth(result.getMonth() + 1);  break;
    case 'QUARTERLY':    result.setMonth(result.getMonth() + 3);  break;
    case 'SEMIANNUALLY': result.setMonth(result.getMonth() + 6);  break;
    case 'YEARLY':       result.setFullYear(result.getFullYear() + 1); break;
  }
  return result;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private http?: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminSettings: AdminSettingsService,
  ) {}

  async createCustomer(payload: AsaasCustomerPayload): Promise<AsaasCustomerResponse> {
    const { data } = await this.request<AsaasCustomerResponse>('post', '/customers', payload);
    return data;
  }

  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
    const encodedCpfCnpj = encodeURIComponent(cpfCnpj);
    const { data } = await this.request<AsaasListResponse<AsaasCustomerResponse>>(
      'get',
      `/customers?cpfCnpj=${encodedCpfCnpj}`,
    );
    return data.data?.[0] ?? null;
  }

  async createSubscription(
    payload: AsaasSubscriptionPayload,
  ): Promise<AsaasSubscriptionResponse> {
    const { data } = await this.request<AsaasSubscriptionResponse>(
      'post',
      '/subscriptions',
      payload,
    );
    return data;
  }

  async createPayment(payload: {
    customer: string;
    billingType: AsaasBillingType;
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
  }): Promise<AsaasPaymentResponse> {
    const { data } = await this.request<AsaasPaymentResponse>('post', '/payments', payload);
    return data;
  }

  async listSubscriptionPayments(subscriptionId: string): Promise<AsaasPaymentResponse[]> {
    const { data } = await this.request<AsaasListResponse<AsaasPaymentResponse>>(
      'get',
      `/subscriptions/${subscriptionId}/payments`,
    );
    return data.data ?? [];
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    const { data } = await this.request<AsaasPaymentResponse>('get', `/payments/${paymentId}`);
    return data;
  }

  async getPaymentPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse | null> {
    try {
      const { data } = await this.request<AsaasPixQrCodeResponse>(
        'get',
        `/payments/${paymentId}/pixQrCode`,
      );
      return data;
    } catch (error) {
      this.logger.warn(`PIX QR Code indisponível para pagamento ${paymentId}: ${error}`);
      return null;
    }
  }

  async resolveFirstSubscriptionPayment(
    subscriptionId: string,
    fallback: {
      customer: string;
      billingType: AsaasBillingType;
      value: number;
      dueDate: string;
      description: string;
      externalReference?: string;
    },
  ): Promise<AsaasPaymentResponse> {
    const payments = await this.listSubscriptionPayments(subscriptionId);
    if (payments.length > 0) {
      return payments[0];
    }

    this.logger.log(
      `Nenhuma cobrança listada para assinatura ${subscriptionId}; criando pagamento avulso.`,
    );
    return this.createPayment(fallback);
  }

  async processWebhook(payload: any) {
    const event = payload.event;
    const isSubscriptionEvent = typeof event === 'string' && event.startsWith('SUBSCRIPTION_');
    const paymentId = payload.payment?.id;

    if (!isSubscriptionEvent && !paymentId) {
      this.logger.warn('Webhook recebido sem payment.id', { event: payload.event, receivedAt: new Date().toISOString() });
      return { success: false, message: 'ID do pagamento não enviado' };
    }

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(payload.payment, event);
        break;
      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(payload.payment, event);
        break;
      case 'PAYMENT_CANCELLED':
        await this.handlePaymentCancelled(payload.payment, event);
        break;
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED':
        await this.handleSubscriptionEventCancelled(payload.subscription, event);
        break;
      default:
        this.logger.log('Evento Asaas não mapeado recebido', { event: payload.event });
    }

    return { success: true };
  }

  private async handlePaymentConfirmed(payment: any, event: string) {
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) {
      this.logger.error('BillingHistory não encontrado para asaasId', { asaasId: payment.id, event });
      return;
    }

    // Idempotência: ignorar reenvios caso o pagamento já foi processado
    if (billing.status === 'PAID') {
      return { received: true, skipped: true };
    }

    await this.prisma.billingHistory.update({
      where: { id: billing.id },
      data: { status: 'PAID', paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date() },
    });

    if (billing.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: billing.subscriptionId },
        include: { plan: true },
      });

      if (subscription) {
        const startedAt = new Date();
        const expiresAt = calculateExpiresAt(startedAt, subscription.plan.periodicity);

        await this.prisma.subscription.update({
          where: { id: billing.subscriptionId },
          data: { status: 'ACTIVE', startedAt, expiresAt },
        });

        await this.grantReferralBonusIfEligible(subscription.customerId, billing.subscriptionId);
      }
    }
  }

  // Credita REFERRAL_BONUS_AMOUNT no promoBalance do referrer na primeira ativação do indicado
  private async grantReferralBonusIfEligible(customerId: string, subscriptionId: string) {
    const activeCount = await this.prisma.subscription.count({
      where: { customerId, status: 'ACTIVE' },
    });

    // Só concede na primeira assinatura ACTIVE deste customer
    if (activeCount !== 1) return;

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });
    if (!customer) return;

    const referral = await this.prisma.referral.findFirst({
      where: { referredId: customer.userId, rewardGranted: false },
    });
    if (!referral) return;

    const referrerCustomer = await this.prisma.customer.findFirst({
      where: { userId: referral.referrerId },
      include: { wallet: true },
    });
    if (!referrerCustomer?.wallet) return;

    const bonusAmountStr = await this.adminSettings.getCached('REFERRAL_BONUS_AMOUNT');
    const bonusAmount = Number(bonusAmountStr);

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: referrerCustomer.wallet!.id },
        data: { promoBalance: { increment: bonusAmount } },
      });

      await tx.walletMovement.create({
        data: {
          walletId: referrerCustomer.wallet!.id,
          type: WalletMovementType.CREDIT,
          origin: WalletMovementOrigin.REFERRAL_BONUS,
          amount: bonusAmount,
          description: 'Bônus por indicação',
          referenceId: referral.id,
        },
      });

      await tx.referral.update({
        where: { id: referral.id },
        data: { rewardGranted: true },
      });
    });

    this.logger.log(
      `Bônus de indicação R$${bonusAmount} creditado para referrer ${referral.referrerId} (referral ${referral.id})`,
    );
  }

  private async handlePaymentCancelled(payment: any, event: string) {
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) {
      this.logger.error('BillingHistory não encontrado para asaasId', { asaasId: payment.id, event });
      return;
    }

    if (billing.status === 'CANCELLED') return;

    await this.prisma.billingHistory.update({
      where: { id: billing.id },
      data: { status: 'CANCELLED' },
    });

    if (billing.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: billing.subscriptionId },
        data: { status: 'CANCELLED' },
      });
      this.logger.log(`Assinatura ${billing.subscriptionId} cancelada via ${event}`, { asaasId: payment.id });
    }
  }

  private async handleSubscriptionEventCancelled(subscription: any, event: string) {
    if (!subscription?.id) {
      this.logger.error('Webhook de cancelamento de assinatura sem subscription.id', { event });
      return;
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { asaasId: subscription.id },
    });

    if (!sub) {
      this.logger.error('Subscription não encontrada para asaasId', { asaasId: subscription.id, event });
      return;
    }

    if (sub.status === 'CANCELLED') return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED' },
    });

    this.logger.log(`Assinatura ${sub.id} cancelada via ${event}`, { asaasId: subscription.id });
  }

  private async handlePaymentOverdue(payment: any, event: string) {
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) {
      this.logger.error('BillingHistory não encontrado para asaasId', { asaasId: payment.id, event });
      return;
    }

    if (billing.status === 'OVERDUE') return;

    await this.prisma.billingHistory.update({
      where: { id: billing.id },
      data: { status: 'OVERDUE' },
    });

    if (billing.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: billing.subscriptionId },
        data: { status: 'OVERDUE' },
      });
    }
  }

  private getHttp(): AxiosInstance {
    if (!this.http) {
      this.http = axios.create(this.buildClientConfig());
    }
    return this.http;
  }

  private buildClientConfig() {
    const rawBaseUrl = process.env.ASAAS_BASE_URL!;
    const baseURL = rawBaseUrl.includes('/api/v3')
      ? rawBaseUrl
      : `${rawBaseUrl.replace(/\/$/, '')}/api/v3`;
    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('ASAAS_API_KEY não configurada no ambiente');
    }

    return {
      baseURL,
      headers: {
        access_token: apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    body?: unknown,
  ): Promise<{ data: T }> {
    try {
      return await this.getHttp().request<T>({ method, url: path, data: body });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { errors?: { description: string }[] })?.errors?.[0]
            ?.description ??
          (error.response?.data as { message?: string })?.message ??
          error.message;
        this.logger.error(`Asaas API ${method.toUpperCase()} ${path}: ${message}`);
        throw new BadRequestException(`Falha na integração Asaas: ${message}`);
      }
      throw error;
    }
  }
}
