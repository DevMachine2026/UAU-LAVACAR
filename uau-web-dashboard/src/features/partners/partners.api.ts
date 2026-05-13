import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type PartnerPayload = {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  category?: string;
  stateId: string;
  cityId: string;
  unitId?: string;
  ownerUserId?: string;
  generatedCashbackPercent?: number;
  customerCashbackPercent?: number;
  uauCommissionPercent?: number;
  acceptedCashbackLimitPercent?: number;
};

export type PartnerItem = PartnerPayload & {
  id: string;
  isActive?: boolean;
  state?: { id: string; name: string };
  city?: { id: string; name: string };
  unit?: { id: string; name: string };
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getPartners() {
  const response = await api.get<ApiEnvelope<PartnerItem[]>>("/partners");
  return unwrap(response.data);
}

export async function createPartner(payload: PartnerPayload) {
  const response = await api.post<ApiEnvelope<PartnerItem>>("/partners", payload);
  return unwrap(response.data);
}

export async function updatePartner(id: string, payload: PartnerPayload) {
  const response = await api.put<ApiEnvelope<PartnerItem>>(`/partners/${id}`, payload);
  return unwrap(response.data);
}

export async function setPartnerActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<PartnerItem>>(`/partners/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}
