import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type PartnerDashboardData = Record<string, unknown>;

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getPartnerOverview() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData>>("/partner-dashboard/overview");
  return unwrap(response.data);
}

export async function getPartnerFinancial() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData>>("/partner-dashboard/financial");
  return unwrap(response.data);
}

export async function getPartnerTransactions() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData | unknown[]>>("/partner-dashboard/transactions");
  return unwrap(response.data);
}

export async function getPartnerCampaigns() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData | unknown[]>>("/partner-dashboard/campaigns");
  return unwrap(response.data);
}

export async function getPartnerCustomers() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData | unknown[]>>("/partner-dashboard/customers");
  return unwrap(response.data);
}

export async function getPartnerAlerts() {
  const response = await api.get<ApiEnvelope<PartnerDashboardData | unknown[]>>("/partner-dashboard/alerts");
  return unwrap(response.data);
}
