import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type Campaign = {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  type?: string;
  priority?: string;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getActiveCampaigns() {
  const response = await api.get<ApiEnvelope<Campaign[] | { items?: Campaign[]; data?: Campaign[] }>>(
    "/campaigns/app/active"
  );
  return unwrap(response.data);
}

export async function viewCampaign(id: string) {
  const response = await api.post<ApiEnvelope<unknown>>(`/campaigns/${id}/view`);
  return unwrap(response.data);
}

export async function clickCampaign(id: string) {
  const response = await api.post<ApiEnvelope<unknown>>(`/campaigns/${id}/click`);
  return unwrap(response.data);
}

export async function dismissCampaign(id: string) {
  const response = await api.post<ApiEnvelope<unknown>>(`/campaigns/${id}/dismiss`);
  return unwrap(response.data);
}
