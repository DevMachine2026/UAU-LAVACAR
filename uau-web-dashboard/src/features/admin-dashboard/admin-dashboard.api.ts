import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type AdminDashboardData = Record<string, unknown>;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getAdminOverview() {
  const response = await api.get<ApiEnvelope<AdminDashboardData>>("/admin-dashboard/overview");
  return unwrap(response.data);
}

export async function getAdminFinancial() {
  const response = await api.get<ApiEnvelope<AdminDashboardData>>("/admin-dashboard/financial");
  return unwrap(response.data);
}

export async function getAdminAlerts() {
  const response = await api.get<ApiEnvelope<string[]>>("/admin-dashboard/alerts");
  return unwrap(response.data);
}

export async function getAdminOperations() {
  const response = await api.get<ApiEnvelope<AdminDashboardData>>("/admin-dashboard/operations");
  return unwrap(response.data);
}

export async function getAdminAnpr() {
  const response = await api.get<ApiEnvelope<AdminDashboardData>>("/admin-dashboard/anpr");
  return unwrap(response.data);
}
