import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type BillingCycle = {
  id?: string;
  status?: string;
  baseAmount?: number | string;
  totalAmount?: number | string;
  amount?: number | string;
  cashbackUsed?: number | string;
  promotionalCashbackUsed?: number | string;
  realCashbackUsed?: number | string;
  gatewayAmount?: number | string;
  paymentMethod?: string;
  dueDate?: string;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  invoiceUrl?: string | null;
  asaasPayment?: {
    pixQrCode?: string | null;
    pixCopyPaste?: string | null;
    invoiceUrl?: string | null;
    status?: string | null;
  };
  subscription?: {
    status?: string;
    plan?: {
      name?: string;
    };
  };
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

function normalizeBillingHistory(value: unknown): BillingCycle[] {
  if (Array.isArray(value)) return value as BillingCycle[];
  if (value && typeof value === "object") {
    const record = value as { items?: BillingCycle[]; data?: BillingCycle[] };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

export async function getMyCurrentBilling() {
  const response = await api.get<ApiEnvelope<BillingCycle | null>>("/billing/my-current");
  return unwrap(response.data);
}

export async function getMyBillingHistory() {
  const response = await api.get<ApiEnvelope<BillingCycle[] | { items?: BillingCycle[]; data?: BillingCycle[] }>>(
    "/billing/my-history"
  );
  return normalizeBillingHistory(unwrap(response.data));
}
