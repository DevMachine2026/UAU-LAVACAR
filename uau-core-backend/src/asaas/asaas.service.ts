import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private http?: AxiosInstance;

  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(payload: AsaasCustomerPayload): Promise<AsaasCustomerResponse> {
    const { data } = await this.request<AsaasCustomerResponse>('post', '/customers', payload);
    return data;
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
    const paymentId = payload.payment?.id;

    if (!paymentId) return { success: false, message: 'ID do pagamento não enviado' };

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(payload.payment);
        break;
      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(payload.payment);
        break;
    }

    return { success: true };
  }

  private async handlePaymentConfirmed(payment: any) {
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) return;

    // Idempotência: ignorar reenvios caso o pagamento já foi processado
    if (billing.status === 'PAID') {
      return { received: true, skipped: true };
    }

    await this.prisma.billingHistory.update({
      where: { id: billing.id },
      data: { status: 'PAID', paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date() },
    });

    if (billing.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: billing.subscriptionId },
        data: { status: 'ACTIVE', startedAt: new Date() },
      });
    }
  }

  private async handlePaymentOverdue(payment: any) {
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) return;

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
    const rawBaseUrl = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com';
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
