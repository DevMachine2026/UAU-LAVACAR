import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type Partner = {
  id: string;
  name: string;
  category?: string | null;
  city?: { name?: string };
  unit?: { name?: string };
  cityName?: string;
  unitName?: string;
  generatedCashbackPercent?: number | string;
  customerCashbackPercent?: number | string;
  uauCommissionPercent?: number | string;
  acceptedCashbackLimitPercent?: number | string;
  isActive?: boolean;
  [key: string]: unknown;
};

export type PartnerTransactionPayload = {
  customerUserId?: string;
  grossAmount: number;
  cashbackToUse: number;
  paymentMethod: "PIX" | "CREDIT_CARD";
};

export type PartnerQrPayload = {
  grossAmount: number;
  customerUserId?: string;
};

export type PartnerTransactionPreview = {
  grossAmount?: number | string;
  cashbackUsed?: number | string;
  gatewayAmount?: number | string;
  generatedCashbackAmount?: number | string;
  customerCashbackAmount?: number | string;
  uauCommissionAmount?: number | string;
  paymentMethod?: string;
  [key: string]: unknown;
};

export type PartnerQrResult = {
  qrCodePayload?: string;
  payload?: string;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getPartners() {
  const response = await api.get<ApiEnvelope<Partner[] | { items?: Partner[]; data?: Partner[] }>>("/partners");
  return unwrap(response.data);
}

export async function getPartnerById(id: string) {
  const response = await api.get<ApiEnvelope<Partner>>(`/partners/${id}`);
  return unwrap(response.data);
}

export async function previewPartnerTransaction(partnerId: string, payload: PartnerTransactionPayload) {
  const response = await api.post<ApiEnvelope<PartnerTransactionPreview>>(
    `/partners/${partnerId}/transactions/preview`,
    payload
  );
  return unwrap(response.data);
}

export async function confirmPartnerTransaction(partnerId: string, payload: PartnerTransactionPayload) {
  const response = await api.post<ApiEnvelope<PartnerTransactionPreview>>(
    `/partners/${partnerId}/transactions/confirm`,
    payload
  );
  return unwrap(response.data);
}

export async function createPartnerQr(partnerId: string, payload: PartnerQrPayload) {
  const response = await api.post<ApiEnvelope<PartnerQrResult>>(`/partners/${partnerId}/transactions/create-qr`, payload);
  return unwrap(response.data);
}
