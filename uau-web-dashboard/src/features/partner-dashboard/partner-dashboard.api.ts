import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type PartnerDashboardData = Record<string, unknown>;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
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
  const response = await api.get<ApiEnvelope<PartnerDashboardData[]>>("/partner-dashboard/transactions");
  return unwrap(response.data);
}

export async function getPartnerAlerts() {
  const response = await api.get<ApiEnvelope<string[]>>("/partner-dashboard/alerts");
  return unwrap(response.data);
}
