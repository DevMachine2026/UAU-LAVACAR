import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AsaasService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async processWebhook(payload: any) {
    // Exemplo básico de webhook handler do Asaas
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
      // Tratar outros eventos conforme necessidade (REFUNDED, DELETED, etc)
    }

    return { success: true };
  }

  private async handlePaymentConfirmed(payment: any) {
    // 1. Acha a cobrança pelo ID do Asaas
    const billing = await this.prisma.billingHistory.findFirst({
      where: { asaasId: payment.id },
    });

    if (!billing) return; // Cobrança não gerenciada por este backend (ou legada)

    // 2. Atualiza para PAID
    await this.prisma.billingHistory.update({
      where: { id: billing.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // 3. Se estiver vinculada a uma assinatura, garante que ela está ACTIVE
    if (billing.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: billing.subscriptionId },
        data: { status: 'ACTIVE' },
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
        data: { status: 'OVERDUE' }, // Pode bloquear o app
      });
    }
  }
}
