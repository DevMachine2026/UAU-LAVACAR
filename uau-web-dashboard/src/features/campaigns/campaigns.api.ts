import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type CampaignPayload = {
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  type: "POPUP" | "BANNER" | "CARD" | "PUSH";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  targetAudience: "ALL" | "CUSTOMERS" | "NON_SUBSCRIBERS" | "ACTIVE_SUBSCRIBERS" | "OVERDUE_USERS" | "FRANCHISE_OWNERS" | "PARTNERS";
  stateId?: string;
  cityId?: string;
  unitId?: string;
  planId?: string;
  startsAt: string;
  endsAt?: string;
  displayFrequency: "ONCE" | "EVERY_OPEN" | "DAILY" | "UNTIL_CLICK";
};

export type CampaignItem = CampaignPayload & { id: string; isActive?: boolean };
export type CampaignMetrics = Record<string, unknown>;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getCampaigns() {
  const response = await api.get<ApiEnvelope<CampaignItem[]>>("/campaigns");
  return unwrap(response.data);
}

export async function createCampaign(payload: CampaignPayload) {
  const response = await api.post<ApiEnvelope<CampaignItem>>("/campaigns", payload);
  return unwrap(response.data);
}

export async function updateCampaign(id: string, payload: CampaignPayload) {
  const response = await api.put<ApiEnvelope<CampaignItem>>(`/campaigns/${id}`, payload);
  return unwrap(response.data);
}

export async function setCampaignActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<CampaignItem>>(`/campaigns/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function getCampaignMetrics(id: string) {
  const response = await api.get<ApiEnvelope<CampaignMetrics>>(`/campaigns/${id}/metrics`);
  return unwrap(response.data);
}
