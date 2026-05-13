import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type FranchiseDashboardData = Record<string, unknown>;

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getFranchiseOverview() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/overview");
  return unwrap(response.data);
}

export async function getFranchiseFinancial() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/financial");
  return unwrap(response.data);
}

export async function getFranchiseOperations() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/operations");
  return unwrap(response.data);
}

export async function getFranchiseAnpr() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/anpr");
  return unwrap(response.data);
}

export async function getFranchisePartners() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/partners");
  return unwrap(response.data);
}

export async function getFranchiseCustomers() {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/customers");
  return unwrap(response.data);
}

export async function getFranchiseAlerts() {
  const response = await api.get<ApiEnvelope<unknown[] | FranchiseDashboardData>>("/franchise-dashboard/alerts");
  return unwrap(response.data);
}
