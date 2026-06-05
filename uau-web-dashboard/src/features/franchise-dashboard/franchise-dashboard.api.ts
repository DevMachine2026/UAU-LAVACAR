import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type FranchiseDashboardData = Record<string, unknown>;

export type FranchiseCustomerFilters = {
  unitId?: string;
  name?: string;
  status?: string;
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getFranchiseOverview(unitId?: string) {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/overview", {
    params: unitId ? { unitId } : undefined,
  });
  return unwrap(response.data);
}

export async function getFranchiseFinancial(unitId?: string) {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/financial", {
    params: unitId ? { unitId } : undefined,
  });
  return unwrap(response.data);
}

export async function getFranchiseOperations(unitId?: string) {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/operations", {
    params: unitId ? { unitId } : undefined,
  });
  return unwrap(response.data);
}

export async function getFranchiseAlerts(unitId?: string) {
  const response = await api.get<ApiEnvelope<string[]>>("/franchise-dashboard/alerts", {
    params: unitId ? { unitId } : undefined,
  });
  return unwrap(response.data);
}

export async function getFranchiseAnpr(unitId?: string) {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData>>("/franchise-dashboard/anpr", {
    params: unitId ? { unitId } : undefined,
  });
  return unwrap(response.data);
}

export async function getFranchiseCustomers(filters?: FranchiseCustomerFilters) {
  const response = await api.get<ApiEnvelope<FranchiseDashboardData[]>>("/franchise-dashboard/customers", {
    params: filters,
  });
  return unwrap(response.data);
}
