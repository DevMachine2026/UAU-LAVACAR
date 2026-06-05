import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type SubscriptionCheckoutPayload = {
  stateId?: string;
  cityId?: string;
  unitId?: string;
  planId: string;
  vehicleId: string;
  paymentMethod: "PIX" | "CREDIT_CARD";
};

export type CheckoutPreview = {
  planAmount?: number | string;
  baseAmount?: number | string;
  promotionalCashbackUsed?: number | string;
  realCashbackUsed?: number | string;
  totalCashbackUsed?: number | string;
  cashbackUsed?: number | string;
  gatewayAmount?: number | string;
  paymentMethod?: string;
  [key: string]: unknown;
};

export type CheckoutConfirmResult = {
  billingCycleId?: string;
  subscriptionId?: string;
  paymentMethod?: string;
  asaasPaymentId?: string;
  invoiceUrl?: string | null;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  dueDate?: string | null;
  value?: number | string;
  planAmount?: number | string;
  gatewayAmount?: number | string;
  promotionalCashbackUsed?: number | string;
  realCashbackUsed?: number | string;
  totalCashbackUsed?: number | string;
  billingCycle?: {
    id?: string;
    status?: string;
    pixQrCode?: string | null;
    pixCopyPaste?: string | null;
    gatewayAmount?: number | string;
    invoiceUrl?: string | null;
  };
  subscription?: {
    id?: string;
    status?: string;
    plan?: { name?: string };
  };
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function previewSubscription(payload: SubscriptionCheckoutPayload) {
  const response = await api.post<ApiEnvelope<CheckoutPreview>>("/checkout/subscription/preview", payload);
  return unwrap(response.data);
}

export async function confirmSubscription(payload: SubscriptionCheckoutPayload) {
  const response = await api.post<ApiEnvelope<CheckoutConfirmResult>>("/checkout/subscription/confirm", payload);
  return unwrap(response.data);
}
